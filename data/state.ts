import { makeVar } from '@apollo/client';

export const dialogueId = makeVar('');
export const focusId = makeVar('');
export const locationId = makeVar('test');
export const topics = makeVar<Array<string>>([]);
export const items = makeVar<Array<string>>([]);
export const time = makeVar(12);

export function setFocus(newFocus: string):void {
  focusId(newFocus);
}

export function setDialogue(newDialogue: string):void {
  dialogueId(newDialogue);
}

export function unfocus():void {
  dialogueId('');
  focusId('');
}

export function addTopic(topicId:string):void {
  if (!topics().includes(topicId)) {
    topics([...topics(), topicId]);
  }
}

export function addItem(itemId:string):void {
  items([...items(), itemId]);
}

export function setTime(newTime:number):void {
  time(newTime);
}
