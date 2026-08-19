function calculateSimilarity(text1, text2) {

    const words1 = new Set(
        text1.toLowerCase().split(/\s+/)
    );

    const words2 = new Set(
        text2.toLowerCase().split(/\s+/)
    );

    let commonWords = 0;

    words1.forEach(word => {
        if (words2.has(word)) {
            commonWords++;
        }
    });

    const totalWords = new Set([
        ...words1,
        ...words2
    ]).size;

    if (totalWords === 0) {
        return 0;
    }

    return Math.round(
        (commonWords / totalWords) * 100
    );
}

function findSimilarComplaints(newComplaint, complaints) {

    return complaints
        .map(item => ({
            id: item.id,
            complaint: item.complaint,
            similarity: calculateSimilarity(
                newComplaint,
                item.complaint
            )
        }))
        .filter(item => item.similarity >= 30)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
}

module.exports = findSimilarComplaints;