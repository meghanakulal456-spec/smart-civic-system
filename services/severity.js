let extractorPromise = null;

async function getExtractor() {

    if (!extractorPromise) {

        extractorPromise = (async () => {

            const { pipeline } =
                await import("@huggingface/transformers");

            return pipeline(
                "feature-extraction",
                "onnx-community/all-MiniLM-L6-v2-ONNX"
            );

        })();

    }

    return extractorPromise;
}


function cosineSimilarity(a, b) {

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {

        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];

    }

    if (
        normA === 0 ||
        normB === 0
    ) {
        return 0;
    }

    return dot /
        (Math.sqrt(normA) *
         Math.sqrt(normB));
}


/*
==================================================
REFERENCE SEVERITY EXAMPLES
==================================================
*/

const severityExamples = {

    Critical: [
        "A live electrical wire is exposed and people are at risk of electrocution.",
        "A major civic problem is creating an immediate danger to human life.",
        "Contaminated drinking water is affecting residents.",
        "A serious incident has already caused an accident."
    ],

    High: [
        "A major water pipeline is leaking continuously and wasting a large amount of water.",
        "A dangerous road defect is creating a serious risk for vehicles and pedestrians.",
        "A large amount of garbage is overflowing in a public area.",
        "A major drainage problem is causing dirty water to flood the street.",
        "Several important street lights are not working and the area is unsafe at night."
    ],

    Medium: [
        "A water pipe is leaking and wasting water.",
        "A pothole is making travel difficult.",
        "A street light is broken.",
        "Garbage is accumulating in the area.",
        "A drainage line is partially blocked."
    ],

    Low: [
        "A small civic issue has been noticed.",
        "There is a minor maintenance problem.",
        "A small inconvenience has been reported."
    ]

};


let referenceEmbeddingsPromise = null;


async function getReferenceEmbeddings() {

    if (!referenceEmbeddingsPromise) {

        referenceEmbeddingsPromise =
            (async () => {

                const extractor =
                    await getExtractor();

                const result = {};

                for (
                    const [level, examples]
                    of Object.entries(
                        severityExamples
                    )
                ) {

                    result[level] = [];

                    for (
                        const text
                        of examples
                    ) {

                        const output =
                            await extractor(
                                text,
                                {
                                    pooling: "mean",
                                    normalize: true
                                }
                            );

                        result[level].push(
                            Array.from(
                                output.data
                            )
                        );

                    }

                }

                return result;

            })();

    }

    return referenceEmbeddingsPromise;
}


/*
==================================================
SEMANTIC SEVERITY
==================================================
*/

async function detectSeverity(text) {

    const complaint =
        (text || "").trim();

    if (!complaint) {
        return "Low";
    }


    const extractor =
        await getExtractor();


    const output =
        await extractor(
            complaint,
            {
                pooling: "mean",
                normalize: true
            }
        );


    const complaintEmbedding =
        Array.from(
            output.data
        );


    const referenceEmbeddings =
        await getReferenceEmbeddings();


    const scores = {};


    for (
        const [level, embeddings]
        of Object.entries(
            referenceEmbeddings
        )
    ) {

        let bestScore = -1;


        for (
            const embedding
            of embeddings
        ) {

            const similarity =
                cosineSimilarity(
                    complaintEmbedding,
                    embedding
                );


            if (
                similarity >
                bestScore
            ) {

                bestScore =
                    similarity;

            }

        }


        scores[level] =
            bestScore;

    }


    let bestLevel =
        "Low";

    let bestScore =
        scores.Low || 0;


    for (
        const [level, score]
        of Object.entries(scores)
    ) {

        if (
            score >
            bestScore
        ) {

            bestScore =
                score;

            bestLevel =
                level;

        }

    }


    console.log(
        "Semantic severity:",
        {
            severity: bestLevel,
            scores: scores
        }
    );


    return bestLevel;

}


module.exports =
    detectSeverity;