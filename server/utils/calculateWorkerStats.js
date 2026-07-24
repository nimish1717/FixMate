const calculateWorkerStats = (worker, avgRating) => {
    const newTotalJobs = worker.totalJobs + 1;
    const newWorkerRating = ((worker.rating * worker.totalJobs) + avgRating) / newTotalJobs;

    let newTrustScore = worker.trustScore;
    if (avgRating >= 4.0) {
        newTrustScore = Math.min(100, worker.trustScore + 1);
    } else if (avgRating <= 2.5) {
        newTrustScore = Math.max(0, worker.trustScore - 5);
    }

    return {
        newTotalJobs,
        newWorkerRating,
        newTrustScore,
    };
};

module.exports = { calculateWorkerStats };
