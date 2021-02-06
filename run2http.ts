import {basename} from "path";
import {writeFileSync, unlinkSync, existsSync} from 'fs'

// this way is more clear but its not working well with IDE suggestions
import {Init, JobResult} from "../xzerox-executor/dist/Init";
import {InputHandlerConstant} from "../xzerox-executor/dist/Input";
import {CacheLineTypes} from "../xzerox-executor/dist/FileCache";
import {timeout, isItUsualError, hasKey} from "../xzerox-executor/dist";
import got from "got";

// get the current filename
// @ts-ignore
let projectName = basename(__filename, '.ts');

// You should remove it on real project
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

init.start(init.readArgs(),
    async (args, fileCache, metric) => {
        ctx.args = args;
        ctx.fileCache = fileCache;
        ctx.metric = metric;
    },
    async (data: string[], agent: any) => {
        try {
            let ip = await handler(data, agent)

            // use this place for handling job result

            ctx.fileCache.save('processed', ip)
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