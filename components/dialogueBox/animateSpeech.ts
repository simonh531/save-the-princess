const animateSpeech = () => {
  let newText = setEmptyDialogue(dialogue.text, theme);
  let id:number;
  let start: number;
  let index = 0;
  let prevTime = -1;
  function animate(timestamp: number) {
    if (start === undefined) {
      start = timestamp;
    }
    // ready for new letter
    if ((timestamp - start) / speed > prevTime) {
      let char = dialogue.text.charAt(index);
      // fastforward through markdown characters
      while (char && newText.charAt(index) === char) {
        index += 1;
        char = dialogue.text.charAt(index);
      }
      let asteriskLength = 0;
      // this will only happen for the first asterisks as
      // the second set gets skipped by the first while loop
      while (char === '*') {
        index += 1;
        char = dialogue.text.charAt(index);
        asteriskLength += 1;
      }
      if (char) {
        newText = `${newText.slice(0, index)}${'*'.repeat(asteriskLength)}${char}${'*'.repeat(asteriskLength)}${newText.slice(index)}`;
        setText(newText);
        index += 1;
        prevTime += 1;
      }
    }
    if (dialogue.text.charAt(index)) {
      id = requestAnimationFrame(animate);
    } else {
      setIsTalking(false);
    }
  }
};

export default animateSpeech;
