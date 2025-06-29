/**
 * Messaging Skill for Telegram Extension
 * 
 * Provides actions related to sending and managing messages.
 */

import { ExtensionAction, Agent, ActionResult, ActionCategory } from '../../../types/agent';
import { TelegramExtension } from '../index';
import { BaseTelegramSkill } from './base-skill';
import { TelegramActionType, TelegramErrorType } from '../types';

export class MessagingSkill extends BaseTelegramSkill {
  /**
   * Get all messaging-related actions
   */
  getActions(): Record<string, ExtensionAction> {
    return {
      [TelegramActionType.SEND_MESSAGE]: {
        name: TelegramActionType.SEND_MESSAGE,
        description: 'Send a text message to a chat',
        category: ActionCategory.COMMUNICATION,
        parameters: { 
          chat_id: 'string|number', 
          text: 'string',
          parse_mode: 'string',
          disable_web_page_preview: 'boolean',
          disable_notification: 'boolean',
          reply_to_message_id: 'number'
        },
        execute: async (agent: Agent, params: any): Promise<ActionResult> => {
          return this.sendMessage(
            params.chat_id, 
            params.text, 
            params.parse_mode, 
            params.disable_web_page_preview,
            params.disable_notification,
            params.reply_to_message_id
          );
        }
      },
      
      [TelegramActionType.EDIT_MESSAGE]: {
        name: TelegramActionType.EDIT_MESSAGE,
        description: 'Edit a previously sent message',
        category: ActionCategory.COMMUNICATION,
        parameters: { 
          chat_id: 'string|number', 
          message_id: 'number',
          text: 'string',
          parse_mode: 'string',
          disable_web_page_preview: 'boolean'
        },
        execute: async (agent: Agent, params: any): Promise<ActionResult> => {
          return this.editMessage(
            params.chat_id, 
            params.message_id, 
            params.text, 
            params.parse_mode, 
            params.disable_web_page_preview
          );
        }
      },
      
      [TelegramActionType.DELETE_MESSAGE]: {
        name: TelegramActionType.DELETE_MESSAGE,
        description: 'Delete a message',
        category: ActionCategory.SYSTEM,
        parameters: { 
          chat_id: 'string|number', 
          message_id: 'number'
        },
        execute: async (agent: Agent, params: any): Promise<ActionResult> => {
          return this.deleteMessage(params.chat_id, params.message_id);
        }
      },
      
      [TelegramActionType.PIN_MESSAGE]: {
        name: TelegramActionType.PIN_MESSAGE,
        description: 'Pin a message in a chat',
        category: ActionCategory.SYSTEM,
        parameters: { 
          chat_id: 'string|number', 
          message_id: 'number',
          disable_notification: 'boolean'
        },
        execute: async (agent: Agent, params: any): Promise<ActionResult> => {
          return this.pinMessage(params.chat_id, params.message_id, params.disable_notification);
        }
      },
      
      [TelegramActionType.UNPIN_MESSAGE]: {
        name: TelegramActionType.UNPIN_MESSAGE,
        description: 'Unpin a message in a chat',
        category: ActionCategory.SYSTEM,
        parameters: { 
          chat_id: 'string|number', 
          message_id: 'number'
        },
        execute: async (agent: Agent, params: any): Promise<ActionResult> => {
          return this.unpinMessage(params.chat_id, params.message_id);
        }
      }
    };
  }

  /**
   * Send a text message to a chat
   */
  async sendMessage(
    chatId: string | number, 
    text: string, 
    parseMode?: string, 
    disableWebPagePreview?: boolean,
    disableNotification?: boolean,
    replyToMessageId?: number
  ): Promise<ActionResult> {
    try {
      const bot = this.extension.getBot();
      const options: any = {};
      if (parseMode) options.parse_mode = parseMode;
      if (disableWebPagePreview) options.disable_web_page_preview = disableWebPagePreview;
      if (disableNotification) options.disable_notification = disableNotification;
      if (replyToMessageId) options.reply_to_message_id = replyToMessageId;
      
      const result = await bot.telegram.sendMessage(chatId, text, options);
      
      return this.createSuccessResult({
        messageId: result.message_id,
        chatId: result.chat.id,
        text: result.text
      });
    } catch (error) {
      return this.createErrorResult(error, TelegramErrorType.INVALID_REQUEST);
    }
  }

  /**
   * Edit a previously sent message
   */
  async editMessage(
    chatId: string | number, 
    messageId: number, 
    text: string, 
    parseMode?: string, 
    disableWebPagePreview?: boolean
  ): Promise<ActionResult> {
    try {
      const bot = this.extension.getBot();
      const options: any = {};
      if (parseMode) options.parse_mode = parseMode;
      if (disableWebPagePreview) options.disable_web_page_preview = disableWebPagePreview;
      
      const result = await bot.telegram.editMessageText(chatId, messageId, undefined, text, options);
      
      return this.createSuccessResult({
        success: true,
        messageId,
        chatId
      });
    } catch (error) {
      return this.createErrorResult(error, TelegramErrorType.INVALID_REQUEST);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(chatId: string | number, messageId: number): Promise<ActionResult> {
    try {
      const bot = this.extension.getBot();
      await bot.telegram.deleteMessage(chatId, messageId);
      
      return this.createSuccessResult({
        success: true,
        messageId,
        chatId
      });
    } catch (error) {
      return this.createErrorResult(error, TelegramErrorType.INVALID_REQUEST);
    }
  }

  /**
   * Pin a message in a chat
   */
  async pinMessage(
    chatId: string | number, 
    messageId: number, 
    disableNotification?: boolean
  ): Promise<ActionResult> {
    try {
      const bot = this.extension.getBot();
      await bot.telegram.pinChatMessage(chatId, messageId, {
        disable_notification: disableNotification
      });
      
      return this.createSuccessResult({
        success: true,
        messageId,
        chatId
      });
    } catch (error) {
      return this.createErrorResult(error, TelegramErrorType.INVALID_REQUEST);
    }
  }

  /**
   * Unpin a message in a chat
   */
  async unpinMessage(chatId: string | number, messageId: number): Promise<ActionResult> {
    try {
      const bot = this.extension.getBot();
      await bot.telegram.unpinChatMessage(chatId, messageId);
      
      return this.createSuccessResult({
        success: true,
        messageId,
        chatId
      });
    } catch (error) {
      return this.createErrorResult(error, TelegramErrorType.INVALID_REQUEST);
    }
  }
}