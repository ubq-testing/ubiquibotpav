import { Comment } from "./payload";
import { LogReturn } from "../adapters/supabase/helpers/tables/logs";

export type HandlerReturnValuesNoVoid = // string | void
  // void | HandlerReturnValuesNoVoid;
  string | LogReturn;
// void | LogReturn;

export type HandlerReturnValuesWithVoid = void | HandlerReturnValuesNoVoid;

export type CommandsHandler = (args: string) => Promise<HandlerReturnValuesNoVoid>;
export type ActionHandler = (args?: string) => Promise<HandlerReturnValuesWithVoid>;
export type CallbackHandler = (
  issueNumber: number,
  text: HandlerReturnValuesNoVoid,
  action: string,
  replyTo?: Comment
) => Promise<void>;
export type PreActionHandler = ActionHandler;
export type PostActionHandler = ActionHandler;

/**
 * @dev A set of handlers to do a pre/main/post action for a given action
 * @param pre - An array of pre-action handlers, it consists of a small piece of handlers.
 *  If pre action isn't needed, you can just leave it empty
 * @param action - An array of auction handlers, it consists of a small piece of handlers
 * @param post - An array of post action handlers, it consists of a small piece of handlers
 */
export type Handler = {
  pre: PreActionHandler[];
  action: ActionHandler[];
  post: PostActionHandler[];
};

export type UserCommands = {
  id: string;
  description: string;
  example?: string;
  handler: CommandsHandler;
  callback: CallbackHandler;
  // successComment?: string;
  // failureComment?: string;
};
