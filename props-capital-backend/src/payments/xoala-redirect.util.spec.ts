import {
  getXoalaRedirectMethod,
  getXoalaRedirectParams,
} from './xoala-redirect.util';

describe('Xoala redirect utilities', () => {
  it('extracts POST redirect parameters from Xoala REST listofParameters payloads', () => {
    const redirect = {
      url: 'https://gateway.example/transaction/PGRRedirect?gw=dtv2',
      method: 'POST',
      listofParameters: [
        { name: 'xid', value: 'abc123' },
        { name: 'accountId', value: '11863' },
        { name: 'dtv2', value: '' },
      ],
    };

    expect(getXoalaRedirectMethod(redirect)).toBe('POST');
    expect(getXoalaRedirectParams(redirect)).toEqual([
      { name: 'xid', value: 'abc123' },
      { name: 'accountId', value: '11863' },
      { name: 'dtv2', value: '' },
    ]);
  });

  it('keeps supporting the legacy parameters field', () => {
    expect(
      getXoalaRedirectParams({
        parameters: [{ name: 'TermUrl', value: 'https://merchant.test/return' }],
      }),
    ).toEqual([{ name: 'TermUrl', value: 'https://merchant.test/return' }]);
  });
});
