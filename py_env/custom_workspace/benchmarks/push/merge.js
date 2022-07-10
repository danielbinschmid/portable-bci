const fs = require('fs');

function crossSubject() {
    const d1 = require("./all_crossSessionSecondSession_20220707-153537.json")
    const d2 = require("./all_crossSession_20220706-182319.json")

    const run_prefix = "run_"
    const runs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

    const subj_prefix = "subj_"
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    const sessions = ["session_False", "session_True"]

    const refID = "before_session_finetuning"

    const proportion_prefix = "proportion_"
    const proportions = [0.05, 0.1, 0.15, 0.2, 0.5]

    const merged = {}

    for (const run of runs) {
        const run_id = run_prefix + run
        merged[run_id] = {};
        for (const subject of subjects) {
            const subj_id = subj_prefix + subject;
            merged[run_id][subj_id] = {}
            for (const session of sessions) {
                merged[run_id][subj_id][session] = {}
                if (session == "session_False") {
                    merged[run_id][subj_id][session][refID] = d1[run_id][subj_id][session][refID];
                    for (const proportion of proportions) {
                        const prop_id = proportion_prefix + proportion;
                        merged[run_id][subj_id][session][prop_id] = d1[run_id][subj_id][session][prop_id]
                    }
                } else {
                    merged[run_id][subj_id][session][refID] = d2[run_id][subj_id][refID];
                    for (const proportion of proportions) {
                        const prop_id = proportion_prefix + proportion;
                        merged[run_id][subj_id][session][prop_id] = d2[run_id][subj_id][prop_id]
                    }
                }
            }
        }
    }

    const currentMillis = "_" + Date.now().toString();
    let benchmarksStringified = JSON.stringify(merged);
    fs.writeFileSync("./all_crossSession" + currentMillis +  '.json', benchmarksStringified);  
} 

crossSubject()