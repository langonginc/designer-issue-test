import { homedir } from 'os';
import { resolve } from 'path';

import { parseDetailsEl, readIssueBody } from './common';
import { Metadata } from '../src/constants/marketplace';
import { makeImage } from './download-images';

export const main = async () => {
    const detailsEls = await readIssueBody();
    const { metadataDetail, param, id } = parseDetailsEl(detailsEls);

    if (!existsSync(resolve('..', 'public', 'resources'))) await mkdir(resolve('..', 'public', 'resources'));
    if (!existsSync(resolve('..', 'public', 'resources', 'images')))
        await mkdir(resolve('..', 'public', 'resources', 'images'));
    if (!existsSync(resolve('..', 'public', 'resources', 'json')))
        await mkdir(resolve('..', 'public', 'resources', 'json'));
    await writeFile(resolve('..', 'public', 'resources', 'json', `${id}.json`), JSON.stringify(param, null, 4), {
        encoding: 'utf-8',
    });

    const metadata: Metadata = {
        name: metadataDetail.name,
        desc: metadataDetail.desc,
        lastUpdateOn: Date.now(),
        contributor: process.env.USER_ID!,
    };
    const stylesJSONString = await readFile(resolve('..', 'public', 'resources', 'styles.json'));
    const stylesJSON = JSON.parse(stylesJSONString.toString());
    stylesJSON[id] = metadata;
    await writeFile(resolve('..', 'public', 'resources', `styles.json`), JSON.stringify(stylesJSON, null, 4), {
        encoding: 'utf-8',
    });

    if (!existsSync(resolve('..', 'public', 'resources', 'images')))
        await mkdir(resolve('..', 'public', 'resources', 'images'));
    if (!existsSync(resolve(homedir(), 'Downloads'))) await mkdir(resolve(homedir(), 'Downloads'));
    const image = await makeImage(resolve('..', 'public', 'resources', 'json', `${id}.json`));
    await writeFile(resolve('..', 'public', 'resources', 'images', `${id}.jpg`), image);

    execSync(`git checkout -b bot-${process.env.ISSUE_NUMBER}`);

    execSync(`git add ${resolve('..', 'public', 'resources')}`);
    execSync(
        `git commit -m "#${process.env.ISSUE_NUMBER} ${process.env.ISSUE_TITLE}" ` +
            `--author="${process.env.USER_LOGIN} <${process.env.USER_ID}+${process.env.USER_LOGIN}@users.noreply.github.com>"`
    );

    execSync(`git add ${resolve('..', 'public', 'resources')}`);
    execSync(`git commit --amend --no-edit`);

    return 0;
};

// @ts-expect-error idk
await main();

