/* BPS1 patch decoder. Kept independent of the emulator so it can be tested. */
(function(root){
  function crc32(bytes){
    let crc=-1;
    for(let i=0;i<bytes.length;i++){
      crc^=bytes[i];
      for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
    }
    return (crc^-1)>>>0;
  }
  function applyBps(source,patch){
    if(!(source instanceof Uint8Array))source=new Uint8Array(source);
    if(!(patch instanceof Uint8Array))patch=new Uint8Array(patch);
    if(patch.length<19||String.fromCharCode(...patch.subarray(0,4))!=="BPS1")throw Error("Keine gültige BPS-Datei.");
    const u32=at=>new DataView(patch.buffer,patch.byteOffset+at,4).getUint32(0,true);
    if(crc32(patch.subarray(0,patch.length-4))!==u32(patch.length-4))throw Error("Patch-Prüfsumme stimmt nicht.");
    let at=4;
    const number=()=>{
      let result=0,shift=1;
      while(true){
        if(at>=patch.length-12)throw Error("BPS-Datei ist unvollständig.");
        const b=patch[at++];result+=(b&127)*shift;
        if(b&128)return result;
        shift*=128;result+=shift;
        if(!Number.isSafeInteger(result))throw Error("BPS-Größenangabe ist ungültig.");
      }
    };
    const sourceSize=number(),targetSize=number(),metadataSize=number();
    if(sourceSize!==source.length)throw Error("Die Ausgangs-ROM hat nicht die richtige Größe.");
    if(targetSize<1||targetSize>64*1024*1024)throw Error("Die Zielgröße ist ungültig.");
    if(metadataSize>patch.length-12-at)throw Error("BPS-Metadaten sind unvollständig.");
    at+=metadataSize;
    if(crc32(source)!==u32(patch.length-12))throw Error("Diese Ausgangs-ROM passt nicht zum Patch (CRC32).");
    const target=new Uint8Array(targetSize);
    let out=0,srcRelative=0,targetRelative=0;
    while(out<targetSize){
      const command=number(),action=command%4,count=Math.floor(command/4)+1;
      if(count>targetSize-out)throw Error("BPS-Schreibbereich ist ungültig.");
      if(action===0){
        if(out+count>source.length)throw Error("BPS-Quellbereich ist ungültig.");
        target.set(source.subarray(out,out+count),out);
      }else if(action===1){
        if(at+count>patch.length-12)throw Error("BPS-Daten sind unvollständig.");
        target.set(patch.subarray(at,at+count),out);at+=count;
      }else{
        const encoded=number(),delta=encoded%2?-Math.floor(encoded/2):Math.floor(encoded/2);
        if(action===2){
          srcRelative+=delta;
          if(srcRelative<0||srcRelative+count>source.length)throw Error("BPS-Quellversatz ist ungültig.");
          target.set(source.subarray(srcRelative,srcRelative+count),out);srcRelative+=count;
        }else{
          targetRelative+=delta;
          if(targetRelative<0||targetRelative>=out)throw Error("BPS-Zielversatz ist ungültig.");
          for(let i=0;i<count;i++)target[out+i]=target[targetRelative+i];
          targetRelative+=count;
        }
      }
      out+=count;
    }
    if(at!==patch.length-12||crc32(target)!==u32(patch.length-8))throw Error("Ergebnis-Prüfsumme stimmt nicht.");
    return target;
  }
  root.applyBps=applyBps;
  if(typeof module!=="undefined")module.exports={applyBps,crc32};
})(typeof window!=="undefined"?window:globalThis);
