export const LICENSES = ['MIT', 'Apache-2.0'];
export const COMMIT_SHA = /^[0-9a-f]{40}$/;

export const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const isText = (v) => typeof v === 'string' && v.trim() !== '';
