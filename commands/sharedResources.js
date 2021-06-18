const incorrectParams = "Your inputted parameters for this command are incorrect, type !help to check the correct parameter for each command";

const filterMessage = (element) => {
    if (element) return true;
    return false;
};

module.exports = {incorrectParams,filterMessage};