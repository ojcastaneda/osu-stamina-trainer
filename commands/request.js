const sharedResources = require('./sharedResources');

const request = (params) => {
    params.filter(filterMessage);
    for (let i = 0; i < params.length; i++) {
        if (isNaN(params[i])) {
            switch (params[i]) {
                //WIP
            }
        } else {
            //WIP
        }
    }
};

module.exports = request;