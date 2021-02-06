import {basename} from "path";
import {writeFileSync, unlinkSync, existsSync} from 'fs'

// this way is more clear but its not working well with IDE suggestions
import {Init, JobResult} from "../xzerox-executor/dist/Init";
import {InputHandlerConstant} from "../xzerox-executor/dist/Input";
import {CacheLineTypes} from "../xzerox-executor/dist/FileCache";
import {timeout, isItUsualError} from "../xzerox-executor/dist";

// get the current filename
// @ts-ignore
let projectName = basename(__filename, '.ts');

// this function only for better understanding of cmd parameters
// it creates inputFile and proxyFile templates
function makeTemplate() {
    function makeTemplateInput() {
        const templateInput = './templateInput.txt'
        const inputData = []
        for (let i = 0; i < 1000; i++) {
            inputData.push(`job#left${i}:right${i}`)
        }
        writeFileSync(templateInput, inputData.join('\n'))
    }
    makeTemplateInput()

    function makeTemplateProxy() {
        const templateProxy = './templateProxy.txt'
        const data = []
        for (let i = 0; i < 10; i++) {
            data.push(`1.2.3.${i}:123${i}`)
            data.push(`username:password@1.2.3.${i}:123${i}`)
            data.push(`username:password@subdomain${i}.asd:1234`)
        }
        writeFileSync(templateProxy, data.join('\n'))
    }
    makeTemplateProxy()

    // remove result file to ensure work
    // you can also comment it to check how 'cacheSystem' works
    const processedTempPath = `./results/${projectName}_processed.txt`
    if (existsSync(processedTempPath)) {
        unlinkSync(processedTempPath)
    }
}
makeTemplate();

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
    async (args, fileCache, metric) => {
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