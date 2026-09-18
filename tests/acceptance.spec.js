// Acceptance tests for BRIEF.md criteria 2-8, run against the real Firebase
// Realtime Database (no mocking). Tests share one database, so they run
// serially in a single worker and each test clears the database first.
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { clearMap } = require('./db.js');

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function exact(text) {
  return new RegExp('^' + escapeRegExp(text) + '$');
}

function rowFor(page, itemName) {
  return page.locator('.row').filter({ has: page.locator('.label', { hasText: exact(itemName) }) });
}
function markButton(page, itemName, buttonLabel) {
  return rowFor(page, itemName).locator('.marks button').filter({ hasText: exact(buttonLabel) });
}
function strengthButton(page, itemName) { return markButton(page, itemName, 'Strength'); }
function superpowerButton(page, itemName) { return markButton(page, itemName, 'Superpower'); }
function developButton(page, itemName) { return markButton(page, itemName, 'Develop'); }

// Navigates to the page, picks a name by exact button text, and waits for
// the person's own marks section to appear.
async function openAs(page, name) {
  await page.goto('/');
  await page.locator('#names button').filter({ hasText: exact(name) }).click();
  await expect(page.locator('#mine')).toBeVisible();
}

// Clicks the given mark button (Strength, Superpower or Develop) on the row
// whose label matches itemName exactly.
async function mark(page, itemName, buttonLabel) {
  await markButton(page, itemName, buttonLabel).click();
}

async function waitSaved(page) {
  await expect(page.locator('#saveStatus')).toHaveText('Saved');
}

async function expectCounters(page, c) {
  await expect(page.locator('#cSkills b')).toHaveText(String(c.skills));
  await expect(page.locator('#cAtt b')).toHaveText(String(c.attitudes));
  await expect(page.locator('#cStar b')).toHaveText(String(c.star));
  await expect(page.locator('#cDev b')).toHaveText(String(c.develop));
}

async function applyMarks(page, set) {
  for (const s of set.skills) await mark(page, s, 'Strength');
  for (const a of set.attitudes) await mark(page, a, 'Strength');
  await mark(page, set.star, 'Superpower');
  for (const d of set.develop) await mark(page, d, 'Develop');
}

// Every skill and attitude name in the page, used to check the summary
// contains every row (23 items: 14 skills, 9 attitudes).
const ALL_SKILLS = [
  'Citizen and stakeholder engagement', 'Creative facilitation', 'Building bridges', 'Brokering',
  'Future acumen', 'Prototyping and iterating', 'Data literacy and evidence', 'Systems thinking', 'Tech literacy',
  'Political and bureaucratic awareness', 'Financing change', 'Intrapreneurship', 'Demonstrating value', 'Storytelling and advocacy',
];
const ALL_ATTITUDES = [
  'Empathetic', 'Imaginative', 'Outcomes-focused', 'Resilient', 'Curious', 'Action-oriented', 'Agile', 'Reflective', 'Courageous',
];
const ALL_ITEMS = ALL_SKILLS.concat(ALL_ATTITUDES);

const TIM_SET = {
  skills: ['Creative facilitation', 'Systems thinking', 'Data literacy and evidence', 'Financing change', 'Storytelling and advocacy'],
  attitudes: ['Curious', 'Agile', 'Reflective'],
  star: 'Systems thinking',
  develop: ['Building bridges', 'Tech literacy'],
};
const CONNIE_SET = {
  skills: ['Citizen and stakeholder engagement', 'Building bridges', 'Future acumen', 'Political and bureaucratic awareness', 'Intrapreneurship'],
  attitudes: ['Empathetic', 'Outcomes-focused', 'Courageous'],
  star: 'Citizen and stakeholder engagement',
  develop: ['Prototyping and iterating', 'Demonstrating value'],
};
const ALEX_SET = {
  skills: ['Brokering', 'Future acumen', 'Data literacy and evidence', 'Intrapreneurship', 'Demonstrating value'],
  attitudes: ['Imaginative', 'Resilient', 'Action-oriented'],
  star: 'Future acumen',
  develop: ['Tech literacy', 'Financing change'],
};

test.describe('nesta competency map acceptance', () => {
  test.beforeAll(async () => {
    await clearMap();
  });
  test.afterAll(async () => {
    await clearMap();
  });
  test.beforeEach(async () => {
    await clearMap();
  });

  test('criterion 2: two browsers each see the other one\'s marks in the team map within 3 seconds of reveal', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await openAs(pageA, 'Tim');
    await openAs(pageB, 'Connie');

    await applyMarks(pageA, TIM_SET);
    await waitSaved(pageA);
    await applyMarks(pageB, CONNIE_SET);
    await waitSaved(pageB);

    await pageA.locator('#revealBtn').click();

    await expect(pageA.locator('#mapBody')).toBeVisible({ timeout: 3000 });
    await expect(pageB.locator('#mapBody')).toBeVisible({ timeout: 3000 });

    // Connie marked 5 skills including one superpower and 3 attitudes: 7
    // cells titled "strength" and 1 titled "superpower".
    await expect(pageA.locator('[title="Connie: strength"]')).toHaveCount(7, { timeout: 3000 });
    await expect(pageA.locator('[title="Connie: superpower"]')).toHaveCount(1);

    await expect(pageB.locator('[title="Tim: strength"]')).toHaveCount(7, { timeout: 3000 });
    await expect(pageB.locator('[title="Tim: superpower"]')).toHaveCount(1);

    await ctxA.close();
    await ctxB.close();
  });

  test('criterion 3: marks placed before a page reload survive the reload for the same name', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await openAs(page, 'Alex');
    await applyMarks(page, ALEX_SET);
    await waitSaved(page);

    await page.reload();
    if (!(await page.locator('#mine').isVisible())) {
      await page.locator('#names button').filter({ hasText: exact('Alex') }).click();
    }
    await expect(page.locator('#mine')).toBeVisible();

    await expectCounters(page, { skills: 5, attitudes: 3, star: 1, develop: 2 });

    for (const s of ALEX_SET.skills) {
      await expect(strengthButton(page, s)).toHaveAttribute('aria-pressed', 'true');
    }
    for (const a of ALEX_SET.attitudes) {
      await expect(strengthButton(page, a)).toHaveAttribute('aria-pressed', 'true');
    }
    await expect(superpowerButton(page, ALEX_SET.star)).toHaveAttribute('aria-pressed', 'true');
    for (const d of ALEX_SET.develop) {
      await expect(developButton(page, d)).toHaveAttribute('aria-pressed', 'true');
    }

    await ctx.close();
  });

  test('criterion 4: the count limits and cross-restrictions are enforced', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await openAs(page, 'Jenny');

    const skillNames = ['Creative facilitation', 'Systems thinking', 'Data literacy and evidence', 'Financing change', 'Storytelling and advocacy'];
    for (const s of skillNames) await mark(page, s, 'Strength');

    const otherSkills = ALL_SKILLS.filter(s => !skillNames.includes(s));
    for (const s of otherSkills) {
      await expect(strengthButton(page, s)).toBeDisabled();
    }

    const attNames = ['Curious', 'Agile', 'Reflective'];
    for (const a of attNames) await mark(page, a, 'Strength');

    const otherAtts = ALL_ATTITUDES.filter(a => !attNames.includes(a));
    for (const a of otherAtts) {
      await expect(strengthButton(page, a)).toBeDisabled();
    }

    await mark(page, 'Systems thinking', 'Superpower');
    for (const s of skillNames.filter(s => s !== 'Systems thinking')) {
      await expect(superpowerButton(page, s)).toBeDisabled();
    }

    const devNames = ['Building bridges', 'Tech literacy'];
    for (const d of devNames) await mark(page, d, 'Develop');
    const otherDevCandidates = ALL_SKILLS.filter(s => !skillNames.includes(s) && !devNames.includes(s));
    for (const d of otherDevCandidates) {
      await expect(developButton(page, d)).toBeDisabled();
    }

    // superpower on a non-strength row is disabled
    await expect(superpowerButton(page, 'Brokering')).toBeDisabled();
    // develop on a strength row is disabled
    await expect(developButton(page, 'Systems thinking')).toBeDisabled();
    // strength on a develop row is disabled
    await expect(strengthButton(page, 'Building bridges')).toBeDisabled();

    await ctx.close();
  });

  test('criterion 5: reveal toggles the map for everyone, and only Tim\'s browser sees the reveal control', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await openAs(pageA, 'Tim');
    await openAs(pageB, 'Agnes');

    await expect(pageA.locator('#revealCtl')).toBeVisible();
    await expect(pageB.locator('#revealCtl')).toBeHidden();

    await pageA.locator('#revealBtn').click();
    await expect(pageB.locator('#mapBody')).toBeVisible({ timeout: 3000 });
    await expect(pageB.locator('#mapHidden')).toBeHidden();

    await pageA.locator('#revealBtn').click();
    await expect(pageB.locator('#mapBody')).toBeHidden({ timeout: 3000 });

    await ctxA.close();
    await ctxB.close();
  });

  test('criterion 6: observations typed in one browser appear in another without overwriting text being typed there', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await openAs(pageA, 'Tim');
    await openAs(pageB, 'Agnes');

    await pageA.locator('#revealBtn').click();
    await expect(pageA.locator('#mapBody')).toBeVisible({ timeout: 3000 });
    await expect(pageB.locator('#mapBody')).toBeVisible({ timeout: 3000 });

    await pageA.locator('#obs1').click();
    await pageA.locator('#obs1').pressSequentially('Alpha typed in A', { delay: 15 });

    await pageB.locator('#obs2').click();
    await pageB.locator('#obs2').pressSequentially('Beta typed in B', { delay: 15 });
    await pageB.locator('#obs1').click();
    await pageB.locator('#obs1').pressSequentially('Beta wrote obs1', { delay: 15 });

    // A's obs2 (unfocused there) picks up B's text within 3 seconds.
    await expect(pageA.locator('#obs2')).toHaveValue('Beta typed in B', { timeout: 3000 });
    // A's obs1, still focused in A, is not overwritten by B's remote edit.
    await expect(pageA.locator('#obs1')).toHaveValue('Alpha typed in A');

    // A moves focus away from obs1 so it can now receive remote updates.
    await pageA.locator('#obs3').focus();

    await expect(async () => {
      const a1 = await pageA.locator('#obs1').inputValue();
      const b1 = await pageB.locator('#obs1').inputValue();
      expect(a1).toBe(b1);
      const a2 = await pageA.locator('#obs2').inputValue();
      const b2 = await pageB.locator('#obs2').inputValue();
      expect(a2).toBe(b2);
    }).toPass({ timeout: 3000 });

    await ctxA.close();
    await ctxB.close();
  });

  test('criterion 7: copy summary and download summary both produce the text summary with every row and the three observations', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await openAs(pageA, 'Tim');
    await openAs(pageB, 'Connie');

    await applyMarks(pageA, TIM_SET);
    await waitSaved(pageA);
    await applyMarks(pageB, CONNIE_SET);
    await waitSaved(pageB);

    await pageA.locator('#revealBtn').click();
    await expect(pageA.locator('#mapBody')).toBeVisible({ timeout: 3000 });

    const obsTexts = {
      obs1: 'Observation one: collective strength in facilitation',
      obs2: 'Observation two: nobody owns financing change alone',
      obs3: 'Observation three: shared interest in prototyping',
    };
    await pageA.locator('#obs1').fill(obsTexts.obs1);
    await pageA.locator('#obs2').fill(obsTexts.obs2);
    await pageA.locator('#obs3').fill(obsTexts.obs3);

    function checkSummary(text) {
      for (const item of ALL_ITEMS) {
        expect(text).toContain(item);
      }
      expect(text).toContain(obsTexts.obs1);
      expect(text).toContain(obsTexts.obs2);
      expect(text).toContain(obsTexts.obs3);
    }

    await pageA.locator('#copyBtn').click();
    await expect(pageA.locator('#summaryPre')).toBeVisible();
    const preText = await pageA.locator('#summaryPre').innerText();
    checkSummary(preText);

    const clipboardText = await pageA.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(preText);

    const [download] = await Promise.all([
      pageA.waitForEvent('download'),
      pageA.locator('#dlBtn').click(),
    ]);
    expect(download.suggestedFilename()).toBe('competency-map.txt');
    const filePath = await download.path();
    const fileContent = fs.readFileSync(filePath, 'utf8');
    checkSummary(fileContent);

    await ctxA.close();
    await ctxB.close();
  });

  test('criterion 8: layout works at 380px wide, marks wrap and only the map scrolls sideways', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 380, height: 800 } });
    const page = await ctx.newPage();

    await openAs(page, 'Tim');
    await mark(page, 'Creative facilitation', 'Strength');
    await mark(page, 'Curious', 'Strength');
    await waitSaved(page);

    await page.locator('#revealBtn').click();
    await expect(page.locator('#mapBody')).toBeVisible({ timeout: 3000 });

    const pageScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(pageScrollWidth).toBeLessThanOrEqual(380);

    const mapwrap = page.locator('.mapwrap');
    const wrapSizes = await mapwrap.evaluate(el => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    expect(wrapSizes.scrollWidth).toBeGreaterThan(wrapSizes.clientWidth);

    const firstRow = page.locator('#mine .row').first();
    const label = firstRow.locator('.label');
    const marksBox = await firstRow.locator('.marks').boundingBox();
    const labelBox = await label.boundingBox();
    expect(marksBox.y).toBeGreaterThanOrEqual(labelBox.y + labelBox.height - 1);

    const buttons = firstRow.locator('.marks button');
    const count = await buttons.count();
    expect(count).toBe(3);
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(380);
    }

    await page.screenshot({ path: 'test-results/criterion-8-380px.png', fullPage: true });

    await ctx.close();
  });
});
