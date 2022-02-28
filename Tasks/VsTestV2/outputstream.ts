import * as stream from 'stream';
import * as os from 'os';
import * as tl from 'azure-pipelines-task-lib/task';

export class StringErrorWritable extends stream.Writable {
    private value: string = '';
    private isErrorStream: boolean;

    constructor(isErrorStream: boolean, options: any) {
        super(options);
        this.isErrorStream = isErrorStream;
    }

    _write(data: any, encoding: string, callback: Function): void {
        this.value += data;

        let errorString: string = data.toString();
        let n = errorString.indexOf(os.EOL);
        while (n > -1) {
            var line = errorString.substring(0, n);

            var command = this.getCommand(line);
            if (command != null) {
                // TODO: Logs telemetry on what was happening.
                // console.log("##vso[telemetry.publish area=TaskHub;feature=FOOFEATURE]<ANY VALID JSON CONTENT HERE>")

                if (true/* TODO: Is Feature Flag Enabled */) {
                    // TODO: Remove entire line instead of just replacing the key work.
                    line = line.replace('##vso','');
                }
            }

            if (this.isErrorStream) {
                tl.error(line);
            }
            else {
                console.log(line);
            }

            // the rest of the string ...
            errorString = errorString.substring(n + os.EOL.length);
            n = errorString.indexOf(os.EOL);
        }
        if (callback) {
            callback();
        }
    }

    toString(): string {
        return this.value;
    }

    getCommand(line: string): string {
        let startIndex = line.indexOf('##vso[');
        if (startIndex < 0) {
            return null;
        }

        let endIndex = line.indexOf(' ', startIndex);
        if (endIndex < 0) {
            endIndex = line.indexOf(']', startIndex);
        }

        if (endIndex < 0) {
            return null;
        }

        return line.substring(startIndex, endIndex - startIndex);
    }
}