// Static demo ticket used to showcase the support chat flow. Lives entirely
// in the frontend — no backend rows are created. Detected by id so the
// chat panel and sidebar can skip their real API calls when this id is
// active.

export const FAKE_TICKET_ID = 'demo-peter-mt5-credentials';

export const FAKE_TICKET = {
  id: FAKE_TICKET_ID,
  subject: 'Support Request - Account',
  category: 'ACCOUNT',
  priority: 'HIGH',
  status: 'RESOLVED',
  message:
    "Hi, I purchased the €50K 2-Step Challenge but haven't received my MT5 credentials yet.",
  createdAt: '2026-05-04T10:15:00.000Z',
  updatedAt: '2026-05-05T10:02:00.000Z',
  user: {
    id: 'demo-peter-user',
    email: 'peterwhite@uwclub.net',
    profile: {
      firstName: 'Peter',
      lastName: 'White',
    },
  },
  guestEmail: null,
  guestName: null,
  messages: [
    {
      id: 'demo-msg-4',
      message: 'Got them, logged in successfully. Thank you for the quick resolution!',
      senderType: 'TRADER',
      createdAt: '2026-05-05T10:02:00.000Z',
    },
  ],
};

export const FAKE_TICKET_MESSAGES = [
  {
    id: 'demo-msg-1',
    ticketId: FAKE_TICKET_ID,
    senderType: 'TRADER',
    senderId: 'demo-peter-user',
    message:
      "Hi, I purchased a €50K 2-Step Challenge two days ago and the payment went through, but I still haven't received my MT5 login credentials. My email is peterwhite@uwclub.net. Could you please check what's going on? I'd like to start trading as soon as possible.",
    createdAt: '2026-05-04T10:15:00.000Z',
  },
  {
    id: 'demo-msg-2',
    ticketId: FAKE_TICKET_ID,
    senderType: 'ADMIN',
    senderId: null,
    message:
      "Hi Peter, thanks for reaching out and apologies for the delay. We've located your purchase and there was a small issue on our broker provisioning side. No issue at all — we're looking into the matter now and will send your MT5 credentials very soon. Thanks for your patience.",
    createdAt: '2026-05-04T11:42:00.000Z',
  },
  {
    id: 'demo-msg-3',
    ticketId: FAKE_TICKET_ID,
    senderType: 'ADMIN',
    senderId: null,
    message:
      'Hi Peter, your MT5 account has been provisioned. Here are your credentials:\n\nEmail: peter-white72p6f@prop-capitals.com\nPassword: bKr(rRs?_19cs8.I7!24\nServer: PropCapitals-Live01\n\nPlease change your password after first login. Best of luck with your challenge!',
    createdAt: '2026-05-05T09:18:00.000Z',
  },
  {
    id: 'demo-msg-4',
    ticketId: FAKE_TICKET_ID,
    senderType: 'TRADER',
    senderId: 'demo-peter-user',
    message: 'Got them, logged in successfully. Thank you for the quick resolution!',
    createdAt: '2026-05-05T10:02:00.000Z',
  },
];

export const isFakeTicketId = (id) => id === FAKE_TICKET_ID;
