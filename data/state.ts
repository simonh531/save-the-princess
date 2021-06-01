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

let prevDialogueId = '';
export function setDialogue(newDialogue: string):void {
  prevDialogueId = dialogueId();
  const newKeys = newDialogue.split('/');
  if (newKeys.length === 1) {
    const oldKeys = prevDialogueId.split('/');
    dialogueId(`${oldKeys[0]}/${newDialogue}`);
  } else {
    dialogueId(newDialogue);
  }
}

export function prevDialogue():void {
  dialogueId(prevDialogueId);
  prevDialogueId = '';
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
