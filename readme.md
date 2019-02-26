# clean-different

解决的问题：打包完成后清除没有变化的文件达到增量发布文件


npm install clean-different --save

>使用

        var clean = require('clean-different')
        
        
        plugins: [
            new clean('all')    //字符串all 代表全部输出，
            
            new clean()    //默认是只输出变化的文件；
        ]
