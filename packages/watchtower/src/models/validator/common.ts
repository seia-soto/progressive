export const isDomain = (text: string) => /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(text);

export const isEmail = (text: string) => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(text);
