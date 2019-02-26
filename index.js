


var fs = require('fs');
var path = require('path');
var del = require('delete');


let outPluginPath = 'node_modules/clean-different/www';
let pluginPath = 'plugin';



function deleteAll(path) {
  var files = [];
  if(fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach(function(file, index) {
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) {
        deleteAll(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}
class CopyFile{
  constructor(obj,options){
    if(options == 'all'){
      //什么都不做
    }
    else{
      this.assest = obj;
      this.currentPath = path.resolve('./');
      this.outPath = this.findOutpath(obj);
      deleteAll(path.resolve('./')+ '/'+this.outPath[1] + 'out');
      this.findFile(this.outPath[0],options);
    }
  }



  findOutpath( obj ){
    let currntPath = path.resolve('./');
    let tempPath = currntPath;
    let key = Object.keys(obj)[0];
    let data = obj[key].existsAt.replace( new RegExp(currntPath,'g'),'').split('/');
    return [tempPath + '/' + data[1],data[1]];
  }

  findFile(outPath,options){
    let files = fs.readdirSync(outPath);
    files.forEach( file => {
      let tempPath = outPath + '/' + file;
      fs.stat( tempPath ,( err,stat )=>{
        if( !stat.isFile()){
          this.findFile( tempPath );
        }
        else {
          let pluginFileExistStatus = this.isExistFold( this.getOldPath(tempPath));
          if( !pluginFileExistStatus ){
            //不存在文件夹
            this.copyFile(tempPath);
            return;
          }
          else{
            //存在文件夹
            let oldFileObj = this.getOldFileObj(tempPath);
            let fileExist = oldFileObj.status;

            if(fileExist){
              // 文件存在
              if(oldFileObj.oldFileName != 'index.html'){
                this.compareFile(tempPath);
              }
            }
            else{
              //不存在老文件，同步新文件；
              this.copyFile(tempPath)
            }
          }
        }
      })
    })
  }

  readFile(filePath){
    return fs.readFileSync(filePath)
  }

  copyFile(toPath){

    let filePathArr = this.getOldPath(toPath).split('/');
    let fileName = filePathArr.pop();
    let filePath = filePathArr.join('/') + '/' + fileName;
    this.createFolder( filePath );
    this.writeFile( filePath,this.readFile(toPath))
  }

  copyOutputFile(toPath){
    let filePathArr = toPath.replace(new RegExp(this.outPath[1]), this.outPath[1]).split('/');
    let fileName = filePathArr.pop();
    let filePath = filePathArr.join('/') + '/' + fileName;
    this.createFolder( filePath );
    this.writeFile( filePath,this.readFile(toPath))
  }

  writeFile( filePath,data ) {
    fs.writeFileSync(filePath,data);
  }

  createFolder( toPath ) {
    let currentPath = path.resolve('./');
    let toPathArr = toPath.replace(new RegExp(currentPath, 'g'), '').split('/');
    toPathArr.pop();
    while( toPathArr.length ){
      currentPath += toPathArr.shift() + '/';
      if( !fs.existsSync(currentPath)){
        fs.mkdirSync(currentPath);
      }
    }
  }

  //判断项目接口是否一致
  compareFile( filePath ){
    let oldFileObj = this.getOldFileObj(filePath);
    let oldFileName = oldFileObj.oldFileName;
    let oldFilePath = oldFileObj.oldFilePath;
    let newFileName = filePath.split('/').pop();
    if( oldFileName == 'index.html') return;
    let newChunk = newFileName.split('.')[1];
    let oldChunk = oldFileName.split('.')[1];
    let oldName = oldFileName.split('.')[0]
    let newName = newFileName.split('.')[0]
    if( oldChunk == newChunk && oldName == newName  ){
      //删除发布文件夹一样的js;
      del.sync(filePath);
      this.delDir(filePath)
    }
    else{
      // 删除旧文件并同步新文件；
      del.sync( oldFilePath + '/' + oldFileName);
      this.writeFile( this.getOldPath(filePath),this.readFile(filePath))
    }
  }

  delDir( newFile  ){
    let arr = newFile.split("/");
    let curretnPath = arr.pop();
    let outPath = arr.join('/');
    if( curretnPath != this.outPath[1] ){
      if( fs.existsSync(outPath) && fs.readdirSync(outPath).length == 0){
        fs.rmdirSync(arr.join('/'))
      }
      this.delDir(outPath);
    }
  }

  getOldPath(filePath){
    let pluginPath = filePath.replace(new RegExp(this.outPath[1]), outPluginPath);
    return pluginPath
  }

  //路径是否存在
  isExistFold( filePath ){
    let foldArr = filePath.split('/');
    foldArr.pop();
    return fs.existsSync(foldArr.join('/'))
  }

  isFile(filePath){
    return  fs.statSync(filePath).isFile();
  }

  getOldFileObj(filePath){
    let foldArr = this.getOldPath(filePath).split('/');
    let file = foldArr.pop();
    let foldPath = foldArr.join('/');
    let fileArr =  file.split('.');
    let fileName = fileArr.length < 3 ? file: fileArr[0];
    let files = fs.readdirSync(foldPath);
    let status = false;
    let oldFileName = 'index.html';
    files.some( tempFile => {
      let tempName = tempFile.split('.').length < 3 ? tempFile : tempFile.split(".")[0];
      if(tempName == fileName ){
        status = true;
        oldFileName = tempFile;
        return true
      }
    });
    return {
      status,
      oldFileName,
      oldFilePath: foldPath
    };
  }
}




class MyPlugin {
  constructor(options){
    this.options = options;
  }

  apply (compiler) {
    // 绑定钩子事件
    compiler.hooks.afterEmit.tapAsync('MyPlugin', (compilation,callback) => {
      new CopyFile( compilation.assets,this.options );
      callback();
    })
  }
}

module.exports = MyPlugin;
