import {existsSync, unlinkSync, writeFileSync} from "fs";

export function makeTemplate(projectName: string) {
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