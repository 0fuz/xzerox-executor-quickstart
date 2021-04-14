import {basename} from "path";
import got from "got";
import {makeTemplate} from "./tempFunctions"; // its only for sample purposes

import {
    JobResult,
    Init,
    InputHandlerConstant,
    CacheLineTypes,
    isItUsualError,
    hasKey
} from "xzerox-executor";

// get the current filename
// @ts-ignore
let projectName = basename(__filename, '.ts');

makeTemplate(projectName); // create sample input and proxy files

let init = new Init({
    fileCacheOptions: {
        project: projectName,
        folder: 'results',
        cache: {
            'processed': CacheLineTypes.data_data,
        }
    },
    defaultMetricKeys: [
        'processed',
        'fake',
        'error'
    ],
    supportedProxyTypes: ['any'],
    inputLineHandler: InputHandlerConstant.data_data
});

let ctx: any = {}

init.start(
    // read cmd args or try to find previous setup of commands via .json config file.
    init.readArgs(),
    // make some variables globally accessible:
    async (args, fileCache, metric) => {
        ctx.args = args;
        ctx.fileCache = fileCache;
        ctx.metric = metric;
    },
    // handling job input data and result
    async (data: string[], agent: any) => {
        try {
            // allowed to handle job execution right there
            // but better make separate class or function
            // like below:
            let ip = await handler(data, agent)

            // handling job result

            ctx.fileCache.save('processed', ip) // store job results
            ctx.metric.inc('ipRetrieved', 1)

            return JobResult.Finished
        } catch (e) {
            if (isItUsualError(e, ctx.metric)) {
                return JobResult.Recheck
            }

            console.log('error', e);
            ctx.metric.inc('error');
            ctx.fileCache.saveError(e);
            return JobResult.Error
        }

    }).then(() => {
        console.log('Work finished')
    })

// write your job handling there
async function handler(data: string[], agent: any) {
    let response = await got.get('https://api64.ipify.org?format=json', {
        responseType: 'json'
    })
    // // or
    // let response = await got.get('https://api64.ipify.org?format=json', {
    //     responseType: 'json',
    //     agent: {https: agent}
    // })

    if (response.statusCode !== 200) {
        throw new Error('WrongStatusCode')
    }

    if (!hasKey(response.body, 'ip')) {
        throw Error('Invalid json data')
    }

    // @ts-ignore
    return response.body.ip
}