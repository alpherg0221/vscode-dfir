type Node = {
    [key: string]: string;
};

export class Mk2Tree {
    readonly _servByPort = {
        "7": "echo", "9": "discard", "13": "daytime",
        "19": "chargen", "20": "ftp-data", "21": "ftp",
        "22": "ssh", "23": "telnet", "25": "smtp",
        "53": "domain", "67": "bootps", "68": "bootpc",
        "69": "tftp", "80": "http", "110": "pop3",
        "113": "auth", "123": "ntp", "137": "netbios-ns",
        "138": "netbios-dgm", "139": "netbios-ssn", "143": "imap",
        "161": "snmp", "162": "snmptrap", "389": "ldap",
        "443": "https", "445": "microsoft-ds", "514": "syslog",
        "587": "submission", "636": "ldaps", "993": "imaps",
        "995": "pop3s"
    };
    readonly nodelist = {};
    readonly root = {
        name: "root",
        timeStamp: "0",
        timeOffset: "0",
        date: "0",
        children: [],
        evt: "ROOT",
        sn: "-1",
        psPath: "ROOT"
    };

    _newEvent(entry: Node) {
        const event = {};
        const keys = [
            "date", "timeStamp", "evt",
            "subEvt", "path", "dstPath",
            "read", "write", "size",
            "recv", "send", "winTitle",
            "api", "tpsGUID", "tpsPath",
            "entry", "valType", "valNum",
            "valStr", "sn",
        ];
        keys.forEach((key) => {
            if (key in entry) {
                event[key] = entry[key];
            }
        });

        ["srcIP", "dstIP"].forEach((key) => {
            if (key in entry) {
                let addr = entry[key];
                // console.log(addr); // debug
                // ip_address(addr)
                event[key] = addr;
                key = key.replace("IP", "Host");
                event[key] = addr;
            }
        });

        ["srcPort", "dstPort", "port"].forEach((key) => {
            if (key in entry) {
                const port = entry[key];
                event[key] = entry[key];
                key = key.replace("Port", "Serv");
                key = key.replace("port", "serv");
                event[key] = port in this._servByPort ? this._servByPort[port] : port;
            }
        });

        if ("url" in entry) {
            event["url"] = entry["url"];
            event["urlHost"] = entry["url"];
        }

        return event;
    }

    _diffTime(node: Node, entry: Node) {
        return (Number(entry["timeStamp"]) - Number(node["timeStamp"])).toFixed(3);
    }

    update(entry: Node) {
        if (entry["evt"] === "ps") {
            if (entry["subEvt"] === "start") {
                let parent;
                if ("parentGUID" in entry) {
                    parent = entry["parentGUID"] in this.nodelist ? this.nodelist[entry["parentGUID"]] : this.root;
                } else {
                    parent = this.root;
                }

                // Create a new node.
                const node = {
                    "name": entry["psGUID"],
                    "lifetime": -1,
                    "timeOffset": this._diffTime(parent, entry),
                    "children": [],
                };
                ["date", "timeStamp", "evt", "subEvt", "psPath", "cmd", "sn"].forEach((key) => {
                    if (key in entry) {
                        node[key] = entry[key];
                    }
                });

                parent["children"].push(node);

                this.nodelist[entry["psGUID"]] = node;
            } else if (entry["subEvt"] === "stop") {
                // Record only if the corresponding ps-start is in the log.
                if (entry["psGUID"] in this.nodelist) {
                    const node = this.nodelist[entry["psGUID"]];
                    node["lifetime"] = this._diffTime(node, entry);
                }
            } else if (entry["subEvt"] === "inject" || entry["subEvt"] === "guardInject") {
                const node = entry["psGUID"] in this.nodelist ? this.nodelist[entry["psGUID"]] : this.root;
                const event = this._newEvent(entry);
                event["timeOffset"] = this._diffTime(node, entry);
                node["children"].push(event);

                if ("tpsGUID" in event && entry["tpsGUID"] in this.nodelist) {
                    // Record only if the process is in the log.
                    const node = this.nodelist[entry["tpsGUID"]];
                    node["injected"] = {
                        "psGUID": entry["psGUID"],
                        "psPath": entry["psPath"],
                        "api": entry["api"],
                        "timeStamp": entry["timeStamp"]
                    };
                }
            }
        } else if (["file", "reg", "net", "win"].includes(entry["evt"])) {
            // XXX: ignore the open events to reduce the log size.
            if (entry["subEvt"] === "open") {
                return;
            }

            const node = entry["psGUID"] in this.nodelist ? this.nodelist[entry["psGUID"]] : this.root;
            const event = this._newEvent(entry);
            event["timeOffset"] = this._diffTime(node, entry);
            node["children"].push(event);
        }
    }
}