# xzerox-executor-quickstart

This repository build for speedup adoption to [xzerox-executor](https://github.com/0fuz/xzerox-executor) project

## Highlights

- [Installation](#installation)
- [Supported cmd arguments](#supported-cmd-arguments)
- [How to touch it](#how-to-touch-it)
- [How to make own job executor](#how-to-make-own-job-executor)
- [Best practices](#best-practices)
- [License](#license)

### Installation
Install the latest stable nodejs from here https://nodejs.org/en/download/.

```
git clone https://github.com/0fuz/xzerox-executor-quickstart
npm install -g typescript ts-node --force
npm install
```

### Supported cmd arguments
```
ts-node run2.ts --help                                                                            ✔  20:45:54  
run2.ts [command]

Commands:
  run2.ts result_name_type   Tells which filenames will be used to store
                             processed data.
  run2.ts supported_proxies  Tells which proxy are recommended to use.

Options:
  --version                       Show version number                  [boolean]
  --input, -i                     Ways to determine:
                                  1. Obsolete filepath
                                  2. HTTP GET url.
                                  Example http://1.0.0.1:12/jobs_batch  should
                                  return same as from 1.

                                  Line contains single ":" delimiter. aa:pp
                                                                        [string]
  --proxy, -p                     Ways to determine:
                                  1. Obsolete filepath
                                  2. HTTP GET url. With response like from file
                                  Example http://1.0.0.1:12/jobs_batch  should
                                  return same as from 1.
                                  Possible line formats:
                                  // ip or domain doesnt matter
                                  ip:port
                                  user:pass@ip:port
                                                                        [string]
  --proxy_type, --pt              Which proxy type to use.              [string]
  --threads, -t                   how much separate executors to run into single
                                  nodejs process           [number] [default: 1]
  --callbackUrl                   Ways to determine:
                                  1. Nothing. Then results of work might be
                                  stored on the files only.
                                  2. HTTP url which supports POST+JSON_body
                                  JSON_body have this shape:
                                  {"metric_or_cache_name_there": [result1str,
                                  result2str, ...]}
                                  or {"metric_name": numberToIncrease}
                                                                        [string]
  --deleteCacheFromInput, --dcfi  Will remove already processed lines from
                                  CacheSettings after loading input
                                                       [boolean] [default: true]
  --maxInputSize, --mis           Once input file larger than maxInputSize in MB
                                  it will throw error.
                                  Default 200mb          [number] [default: 200]
  --help, -h                      Show help                            [boolean]

```

### How to touch it

Execute code below to see what is it. All needed files will be created.
```
ts-node run2.ts --input='templateInput.txt' --proxy='templateProxy.txt' --proxy_type='https' --threads=2
```
Once executor receives legit arguments to run job it will create */args/run2.json* with passed arguments. 
Its useful when you don't need to pass each time arguments from cmd.

You can execute without arguments now
```
ts-node run2.ts
```

As you can see /results/run2_processed.txt contains same amount of lines as on input file

Enjoy with exploring code, comments and tests!

### How to make own job executor

- Make a copy of example file but with different project name.
- Remove unnecessary code.
- Start build own executor.

### Best practices
**run2.ts** is an example of job processing file.

Job processing file are:

1. Have same file-name as projectName.
1. Folder contains several job processing files. Stored in the root of project directory.
1. Don't hide errors. always process any unknown errors.
1. Write low nesting code. Instead of nested ifs use separate if's with return/continue/break.
1. You might use throwing custom errors to specify detailed reasons why it happens. For example "bannedProxy". It will appear on metrics.
1. You should love debugger. Its much better than console.log debugging. Its useful a lot when unknown what this variable contains.
1. Better use typescript files but anyway you can compile it to javascript by ``tsc`` command and *dist* folder

### License
MIT License.