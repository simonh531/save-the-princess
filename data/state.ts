import { makeVar } from '@apollo/client';

export const dialogue = makeVar('');
export const focus = makeVar('');
export const location = makeVar('test');
export const topics = makeVar<Array<string>>([]);
export const items = makeVar<Array<string>>([]);

export function setFocus(newFocus: string):void {
  focus(newFocus);
}

export function setDialogue(newDialogue: string):void {
  dialogue(newDialogue);
}

export function unfocus():void {
  dialogue('');
  focus('');
}

export function addTopic(topicId:string):void {
  if (!topics().includes(topicId)) {
    topics([...topics(), topicId]);
  }
}

export function addItem(itemId:string):void {
  items([...items(), itemId]);
}
