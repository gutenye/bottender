/*
  eslint-disable class-methods-use-this
  @flow
*/
import { MessengerClient } from 'messaging-api-messenger';

import MessengerContext from '../context/MessengerContext';
import type { MessengerRawEvent } from '../context/MessengerEvent';

import type { FunctionalHandler } from './Bot';
import type { Connector, SessionWithUser } from './Connector';

type MessengerRequestBody = {
  entry: Array<{
    messaging: Array<MessengerRawEvent>,
  }>,
};

type MessengerUser = {
  id: string,
};

export type MessengerSession = SessionWithUser<MessengerUser>;

export default class MessengerConnector
  implements Connector<MessengerRequestBody, MessengerUser> {
  _graphAPIClient: MessengerClient;

  constructor(accessToken: string) {
    this._graphAPIClient = MessengerClient.factory(accessToken);
  }

  _getRawEventFromRequest(body: MessengerRequestBody) {
    return body.entry[0].messaging[0];
  }

  get platform(): string {
    return 'messenger';
  }

  getSenderIdFromRequest(body: MessengerRequestBody): string {
    const rawEvent = this._getRawEventFromRequest(body);
    if (rawEvent.message && rawEvent.message.is_echo) {
      return rawEvent.recipient.id;
    }
    return rawEvent.sender.id;
  }

  async getUserProfile(senderId: string): Promise<MessengerUser> {
    const { data } = await this._graphAPIClient.getUserProfile(senderId);
    return data;
  }

  async handleRequest({
    body,
    session,
    handler,
  }: {
    body: MessengerRequestBody,
    session: MessengerSession,
    handler: FunctionalHandler,
  }): Promise<void> {
    const rawEvent = this._getRawEventFromRequest(body);

    const context = new MessengerContext({
      graphAPIClient: this._graphAPIClient,
      rawEvent,
      session,
    });

    await handler(context);
  }
}
