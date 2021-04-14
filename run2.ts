import {basename} from "path";
import {writeFileSync, unlinkSync, existsSync} from 'fs'

// // import this way
// import {JobResult, Init} from "xzerox-executor/dist/Init";
// import {InputHandlerConstant} from "xzerox-executor/dist/Input";
// import {FileCache, CacheLineTypes} from "xzerox-executor/dist/FileCache";
// import {timeout} from "xzerox-executor/dist/Helper";
// import {isItUsualError} from "xzerox-executor/dist/HttpHelper";
// import {RequiredArgs} from "xzerox-executor/dist/Init";

// or import this way
import {
    JobResult,
    Init,
    InputHandlerConstant,
    FileCache,
    CacheLineTypes,
    timeout,
    isItUsualError,
    RequiredArgs,
    Metric
} from "xzerox-executor";
import {makeTemplate} from "./tempFunctions";

// get the current filename
// @ts-ignore
let projectName = basename(__filename, '.ts');

makeTemplate(projectName); // create sample input and proxy files

let init = new Init({
    fileCacheOptions: {
        project: projectName,
        folder: 'results', // folder for cache files
        cache: {
            // name of the file and their content format. In the file system it ll have ./results/projectName_processed.txt name
            'processed': CacheLineTypes.data_data,
        }
    },
    // You can describe there the right order of metric keys. Anyway new keys will be added at the end
    // auto-added once needed are: left, error, timeout
    defaultMetricKeys: [
        'processed',
        'fake',
        'error'
    ],
    // This is useful for later usage. To be noticed about recommended one.
    supportedProxyTypes: ['any'],
    // Describe the input line format. Also possible to put own function
    inputLineHandler: InputHandlerConstant.data_data
});

let ctx: any = {}

init.start(init.readArgs(),
    // it will be called once
    async (args: RequiredArgs, fileCache: FileCache, metric: Metric) => {
        ctx.args = args;
        ctx.fileCache = fileCache;
        ctx.metric = metric;
    },
    async (data: string[], agent: any) => { // every parsed inputLineHandler are in 'data'
        try {
            // put your job processing for single 'thread'/'worker' there

            // increase metrics
            ctx.metric.inc('newKey', 1)

            // save job results
            ctx.fileCache.save('processed', data[0])
            await timeout(10)

            // return job status.
            // JobResult.Finished = job done
            // JobResult.Recheck/JobResult.Error = job will be processed again
            return JobResult.Finished
        } catch (e) {
            // it ll check does e.message contains some of metric keys. If so then it ll increment specified metric
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