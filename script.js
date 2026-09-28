const fileInput=document.getElementById('fileInput');
const dropZone=document.getElementById('dropZone');
const quality=document.getElementById('quality');
const qualityValue=document.getElementById('qualityValue');
const results=document.getElementById('results');
const compressBtn=document.getElementById('compressBtn');
const clearBtn=document.getElementById('clearBtn');

let files=[];

quality.addEventListener('input',()=>qualityValue.textContent=quality.value);

fileInput.addEventListener('change',e=>{
  addFiles([...e.target.files]);
});

['dragenter','dragover'].forEach(ev=>dropZone.addEventListener(ev,e=>{
  e.preventDefault(); dropZone.classList.add('drag');
}));
['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev,e=>{
  e.preventDefault(); dropZone.classList.remove('drag');
}));
dropZone.addEventListener('drop',e=>addFiles([...e.dataTransfer.files]));

function addFiles(newFiles){
  const jpgs=newFiles.filter(f=>/^image\/(jpeg|jpg)$/i.test(f.type));
  files=[...files,...jpgs];
  renderFiles();
}

function renderFiles(){
  results.innerHTML='';
  files.forEach((file,i)=>{
    const url=URL.createObjectURL(file);
    const div=document.createElement('div');
    div.className='item';
    div.innerHTML=`
      <div class="item-top">
        <img class="preview" src="${url}">
        <div class="info">
          <div class="name">${escapeHtml(file.name)}</div>
          <div class="sizes">Original: ${formatBytes(file.size)}</div>
          <div class="progress"><span id="progress-${i}"></span></div>
          <div id="status-${i}" class="sizes">Ready to compress</div>
        </div>
      </div>`;
    results.appendChild(div);
  });
  compressBtn.disabled=files.length===0;
}

compressBtn.addEventListener('click',async()=>{
  compressBtn.disabled=true;
  for(let i=0;i<files.length;i++) await compressFile(files[i],i);
  compressBtn.disabled=false;
});

async function compressFile(file,index){
  const img=new Image();
  const url=URL.createObjectURL(file);
  await new Promise((resolve,reject)=>{
    img.onload=resolve; img.onerror=reject; img.src=url;
  });

  const maxSize=2400;
  let w=img.naturalWidth,h=img.naturalHeight;
  if(w>maxSize||h>maxSize){
    const scale=Math.min(maxSize/w,maxSize/h);
    w=Math.round(w*scale); h=Math.round(h*scale);
  }

  const canvas=document.createElement('canvas');
  canvas.width=w; canvas.height=h;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(img,0,0,w,h);

  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',Number(quality.value)/100));
  const downloadUrl=URL.createObjectURL(blob);

  document.getElementById(`progress-${index}`).style.width='100%';
  document.getElementById(`status-${index}`).innerHTML=
    `Compressed: ${formatBytes(blob.size)} — Saved ${savedPercent(file.size,blob.size)}%
     <br><a class="download" href="${downloadUrl}" download="${file.name.replace(/\.[^.]+$/,'')}_compressed.jpg">Download JPG</a>`;
  URL.revokeObjectURL(url);
}

clearBtn.addEventListener('click',()=>{
  files=[];
  fileInput.value='';
  results.innerHTML='';
  compressBtn.disabled=true;
});

function formatBytes(bytes){
  if(bytes<1024)return bytes+' B';
  if(bytes<1024*1024)return (bytes/1024).toFixed(1)+' KB';
  return (bytes/1024/1024).toFixed(2)+' MB';
}
function savedPercent(original,compressed){
  return Math.max(0,Math.round((1-compressed/original)*100));
}
function escapeHtml(s){
  return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
