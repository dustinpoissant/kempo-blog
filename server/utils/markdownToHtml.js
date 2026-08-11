export default (markdown) => {
  if(!markdown) return '';
  
  let html = markdown;
  
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  const lines = html.split('\n');
  let result = [];
  let inList = false;
  let listItems = [];
  
  for(let i = 0; i < lines.length; i++){
    const line = lines[i];
    
    if(line.match(/^- /)){
      if(!inList){
        inList = true;
        listItems = [];
      }
      listItems.push('<li>' + line.replace(/^- /, '') + '</li>');
    } else {
      if(inList){
        result.push('<ul>' + listItems.join('\n') + '</ul>');
        inList = false;
        listItems = [];
      }
      
      if(line.trim()){
        if(!line.match(/^<[h|s|e|u]/)){
          result.push('<p>' + line + '</p>');
        } else {
          result.push(line);
        }
      }
    }
  }
  
  if(inList){
    result.push('<ul>' + listItems.join('\n') + '</ul>');
  }
  
  return result.join('\n');
};
