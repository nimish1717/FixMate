
const calculatePlatformFee = (workerCharge) => {
    return Math.round(workerCharge * 0.10);
};

module.exports = { calculatePlatformFee };