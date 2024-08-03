// https://askubuntu.com/questions/1444962/how-do-i-install-firefox-in-wsl-when-it-requires-snap-but-snap-doesnt-work

import { readdir, readFile } from 'fs/promises';
import { homedir } from 'os';
import { resolve } from 'path';

import { Browser, Builder, By, Capabilities, until } from 'selenium-webdriver';

const DesignerURL = 'http://localhost:5173/rmp-designer/'; // 'https://uat-railmapgen.github.io/rmp-designer/';

export const makeImage = async (filePath: string) => {
    const capabilities = new Capabilities();
    capabilities.set('browserName', Browser.FIREFOX);
    // https://developer.mozilla.org/en-US/docs/Web/WebDriver/Capabilities/firefoxOptions
    capabilities.set('moz:firefoxOptions', {
        args: ['-headless'],
        // increase localStorage size to allow super big saves
        prefs: { 'dom.storage.default_quota': 102400 },
    });

    const driver = await new Builder().withCapabilities(capabilities).build();
    await driver.get(DesignerURL);

    const uploadMenuButtonXPath = '//*[@id="upload_param"]';
    await driver.wait(until.elementLocated(By.xpath(uploadMenuButtonXPath)), 10000);
    await driver.findElement(By.xpath(uploadMenuButtonXPath)).sendKeys(filePath);

    await new Promise(r => setTimeout(r, 1000)); // wait a second to be fully loaded

    const downloadMenuButtonXPath = '//*[@id="menu-button-download"]';
    await driver.findElement(By.xpath(downloadMenuButtonXPath)).click();

    // https://stackoverflow.com/questions/75168142/how-to-choose-an-option-from-a-non-select-dropdown-menu-in-selenium-python
    const exportImageButtonXPath =
        "//button[contains(@class, 'chakra-menu__menuitem')][starts-with(@id, 'menu-list-download-menuitem-')][2]";
    await driver.findElement(By.xpath(exportImageButtonXPath)).click();

    const downloadButtonXPath = '//*[@id="exportJPG"]';
    await driver.findElement(By.xpath(downloadButtonXPath)).click();

    let retry = 0;
    while (retry < 3) {
        retry += 1;
        await new Promise(r => setTimeout(r, 20000));
        const files = await readdir(resolve(homedir(), 'Downloads'));
        const filename = files.find(s => s.startsWith('RMP-Designer_') && s.endsWith('.jpg'));
        if (!filename) continue;

        await driver.quit();
        return await readFile(resolve(homedir(), 'Downloads', filename));
    }

    throw new Error('No image generated after 60 secs.');
};
