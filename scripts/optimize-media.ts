import sharp from 'sharp';
import {readdir,stat} from 'node:fs/promises';
for(const file of await readdir('public/media'))if(/\.jpe?g$/.test(file)&&!file.includes('Logo')){for(const width of [320,640,1080]){const path=`public/media/${file.replace(/\.jpe?g$/,`-${width}.webp`)}`;await sharp(`public/media/${file}`).resize({width,withoutEnlargement:true}).webp({quality:84}).toFile(path);console.log(path,(await stat(path)).size)}}
