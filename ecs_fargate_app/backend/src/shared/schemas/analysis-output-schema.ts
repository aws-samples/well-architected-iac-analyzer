/**
 * JSON Schema definitions for Bedrock structured output.
 *
 * When the model supports constrained decoding, the schema is compiled into
 * a grammar that prevents the model from generating tokens outside the
 * allowed structure. This eliminates the need for post-hoc JSON cleaning
 * and retries caused by malformed responses.
 *
 * Schema design follows constrained-decoding best practices:
 *   - Descriptive field names serve as implicit generation hints
 *   - Description strings act as micro-prompts with evaluation criteria
 *   - Nullable types for conditional fields avoid forced hallucination
 *   - additionalProperties: false on every object (Bedrock requirement)
 *   - Field order matches the reasoning flow: identify → assess → explain → recommend
 */

/**
 * Returns the JSON Schema object that describes the expected best-practice
 * analysis output. The schema is intentionally kept flat (one level of
 * array nesting) to minimise latency overhead from grammar enforcement.
 */
export function getAnalysisJsonSchema(): Record<string, unknown> {
    return {
        type: 'object',
        properties: {
            bestPractices: {
                type: 'array',
                description:
                    'Analysis of each best practice from the <best_practices_json> section against the provided infrastructure artifact. Must include ALL best practices listed without skipping any.',
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description:
                                'The exact Best Practice name as provided in the <best_practices_json> section. Do not rephrase, summarize, or alter the name in any way.',
                        },
                        relevant: {
                            type: 'boolean',
                            description:
                                'true only if the Technical Relevancy score for this best practice in the <kb> section is 7 or greater AND the practice directly relates to AWS resources, configurations, architecture patterns, or technical implementations that can be assessed from the provided artifact. false if it primarily concerns organizational processes, team structures, governance, business practices outside infrastructure definition, or cannot be reasonably assessed from the technical artifact.',
                        },
                        applied: {
                            type: ['boolean', 'null'],
                            description:
                                'Whether the best practice is implemented or followed in the provided artifact. Set to true or false when relevant is true. Must be null when relevant is false.',
                        },
                        reasonApplied: {
                            type: ['string', 'null'],
                            description:
                                'Concise explanation (maximum 100 words) of why the best practice is already applied or followed, citing specific resources or configurations as evidence. Provide only when relevant is true and applied is true. Must be null otherwise.',
                        },
                        reasonNotApplied: {
                            type: ['string', 'null'],
                            description:
                                'Concise explanation (maximum 100 words) of why the best practice is not applied or followed, noting what is missing or misconfigured. Provide only when relevant is true and applied is false. Must be null otherwise.',
                        },
                        recommendations: {
                            type: ['string', 'null'],
                            description:
                                'Detailed recommendations (maximum 400 words) including: the risk of not following this best practice, specific actionable recommendations, and implementation examples such as IaC code snippets where appropriate. Provide only when relevant is true and applied is false. Must be null otherwise.',
                        },
                    },
                    required: [
                        'name',
                        'relevant',
                        'applied',
                        'reasonApplied',
                        'reasonNotApplied',
                        'recommendations',
                    ],
                    additionalProperties: false,
                },
            },
        },
        required: ['bestPractices'],
        additionalProperties: false,
    };
}

/**
 * Builds the `outputConfig` parameter accepted by the Bedrock Converse API.
 * Pass the returned object as `outputConfig` in the ConverseCommand input
 * to enable schema-constrained generation.
 *
 * Note: first-time schema compilation may add latency (up to a few minutes).
 * Compiled grammars are cached for 24 hours per account.
 */
export function buildAnalysisOutputConfig(): Record<string, unknown> {
    return {
        textFormat: {
            type: 'json_schema',
            structure: {
                jsonSchema: {
                    schema: JSON.stringify(getAnalysisJsonSchema()),
                    name: 'best_practice_analysis',
                    description:
                        'Best practice analysis review results',
                },
            },
        },
    };
}