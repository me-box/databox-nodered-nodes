module.exports = function (RED) {
    "use strict";
    const moment = require("moment");
    const numberoperators = ["lt","gt","lte","gte","eq","even","odd"];
    const stringoperators = ["equal","contains","startswith"];
    const timeoperators = ["same", "earlier", "later", "between"];

    const evaluate_numeric = (rule, operand)=>{
        console.log("in evaluate numeric!");

        try{
            
            const msgop = Number(operand);
            
            console.log("messae op is", msgop);

            if (rule.operand === "even"){
                console.log(`evaluating ${msgop} is even`);
                return msgop%2 === 0;
            }
            
            if (rule.operand === "odd"){
                console.log(`evaluating ${msgop} is odd`);
                return msgop%2 !== 0;
            }

            if (rule.operand === "range"){
                const [from,to] = rule.operand.split(":");
                const _from = Number(from);
                const _to = Number(to);
                return msgop >= _from && msgop<_to;
            }

            const ruleop = Number(rule.operand);

            console.log(msgop, ruleop);

            switch (rule.operator){
                case "lt":
                    console.log(`evaluating ${msgop}<${ruleop}`);
                    return msgop < ruleop;

                case "gt":
                    console.log(`evaluating ${msgop}>${ruleop}`);
                    return msgop > ruleop;

                case "lte":
                    console.log(`evaluating ${msgop}<=${ruleop}`);
                    return msgop <= ruleop;
                
                case "gte":
                    console.log(`evaluating ${msgop}>=${ruleop}`);
                    return msgop >= ruleop;
                
                case "eq":
                    console.log(`evaluating ${msgop}===${ruleop}`);
                    return msgop === ruleop;
                
                default:
                    return false;
            }
        }catch(err){
            return false;
        }
    }

    const evaluate_string = (rule,operand)=>{
        try{
            
            const msgop = `${operand}`;
            const ruleop = `${rule.operand}`;

            switch (rule.operator){
                case "equal":
                    console.log(`evaluating ${msgop}===${ruleop}`);
                    return msgop === ruleop;

                case "contains":
                    console.log(`evaluating ${msgop} conatins ${ruleop}`);
                    return msgop.includes(ruleop);

                case "startswith":
                    console.log(`evaluating ${msgop} startswith ${ruleop}`);
                    return msgop.startsWith(ruleop);
                
                default:
                    return false;
            }
    
        }catch(err){
            return false;
        }
    }

    const evaluate_time = (rule, operand)=>{
        try{
            const msgop = moment(operand);

            if (rule.operator === "between"){
                const [from,to] = rule.operand.split(":");
                const _from = Moment(from);
                const _to = Moment(to);
                msgop.isBetween(_from,_to);
            }
            
            
            const ruleop = moment(rule.operand);

            switch (rule.operator){

                case "same":
                    return msgop.isSame(ruleop);

                case "earlier":
                    return msgop.isBefore(ruleop);

                case "later":
                    return msgop.isAfter(ruleop);
 
                default:
                    return false;
            }
    
        }catch(err){
            return false;
        }
    }

    const extract = (msg, path) => {
        return path.reduce((acc, item) => {
            return acc[item];
        }, msg)
    }

    const match = (rule, msg, msgindex)=>{
        if (msg.id != rule.input){
            return false;
        }

        console.log("in rule with ruke", rule);

        const msgoperand  = rule.attribute === "message number" ? msgindex : extract(msg, rule.attribute.split("."))

        console.log("setting msgoperand to", msgoperand);

        console.log("rule operator is", rule.operator);

        if (numberoperators.indexOf(rule.operator) != -1){
            return evaluate_numeric(rule, msgoperand);
        }
        if (stringoperators.indexOf(rule.operator) != -1){
            return evaluate_string(rule, msgoperand);
        }
        if (timeoperators.indexOf(rule.operator) != -1){
            return evaluate_time(rule, msgoperand);
        }
        return false;
    }

    function Rules(n) {
        console.log("creating rules node")
        RED.nodes.createNode(this, n);
        var node = this;
        const rules = n.rules || [];
        const msgindexes = {};
        
        console.log("in rules node with rules", rules);

        this.on('input', function (msg) {
            //const src = this.path().hops[0].source;
            msgindexes[msg.id] = (msgindexes[msg.id] || 0) + 1;

            console.log("seen a message", JSON.stringify(msg,null,4));

            rules.forEach((rule)=>{
                if (match(rule, msg, msgindexes[msg.id])){
                    console.log('seen a match');
                    node.send(rule.outputMessage);
                }
                console.log("no match");
            });
        });
    }
    RED.nodes.registerType("rules", Rules);
}