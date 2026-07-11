import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';


/**
 * Load users database
 */
export async function fetchUsers() {
    try {
        const usersResult = await fetch(`${dir}/users.json`);
        return await usersResult.json();
    } catch {
        console.error('Failed to load users.');
        return {};
    }
}


/**
 * Get username from ID
 */
export function getUsername(users, id) {
    return users[id]?.username || id;
}


/**
 * Load all levels
 */
export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);

    try {
        const list = await listResult.json();

        return await Promise.all(
            list.map(async (path, rank) => {

                const levelResult = await fetch(`${dir}/${path}.json`);

                try {
                    const level = await levelResult.json();

                    return [
                        {
                            ...level,
                            path,

                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];

                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );

    } catch {
        console.error('Failed to load list.');
        return null;
    }
}



export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        return await editorsResults.json();
    } catch {
        return null;
    }
}



/**
 * Leaderboard system using user IDs
 */
export async function fetchLeaderboard() {

    const list = await fetchList();
    const users = await fetchUsers();

    const scoreMap = {};
    const errs = [];


    list.forEach(([level, err], rank) => {

        if (err) {
            errs.push(err);
            return;
        }


        // VERIFIER
        const verifier = level.verifier;


        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };


        scoreMap[verifier].verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });



        // RECORDS
        level.records.forEach((record) => {

            const user = record.user;


            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };


            const { completed, progressed } = scoreMap[user];


            if (record.percent === 100) {

                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(
                        rank + 1,
                        100,
                        level.percentToQualify
                    ),
                    link: record.link,
                });

                return;
            }


            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: score(
                    rank + 1,
                    record.percent,
                    level.percentToQualify
                ),
                link: record.link,
            });

        });

    });



    const res = Object.entries(scoreMap).map(([user, scores]) => {

        const {
            verified,
            completed,
            progressed
        } = scores;


        const total = [
            verified,
            completed,
            progressed
        ]
        .flat()
        .reduce(
            (prev, cur) => prev + cur.score,
            0
        );


        return {
    user: getUsername(users, user),
    id: user,
    total: round(total),
    ...scores,
};

    });


    return [
        res.sort((a, b) => b.total - a.total),
        errs
    ];
}
