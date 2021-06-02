import { makeVar } from '@apollo/client';
import { StateItem } from '../utils/interfaces';

export const dialogueId = makeVar('');
export const focusId = makeVar('');
export const locationId = makeVar('test');
export const topics = makeVar<Array<string>>([]);
export const items = makeVar<Array<StateItem>>([{ id: 'pocketwatch', quantity: 1 }]);
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
  const exists = items().find((item) => item.id === itemId);
  if (exists) {
    exists.quantity += 1;
    items([...items()]);
  } else {
    items([...items(), { id: itemId, quantity: 1 }]);
  }
}

export function setTime(newTime:number):void {
  time(newTime);
}
