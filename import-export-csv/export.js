// const StoryblokClient = require('storyblok-js-client')
import StoryblokClient from 'storyblok-js-client'
import fs from 'fs'
// const fs = require('fs')
// const config = require('./config')
import config from './config.js'
import { fileTypeFromBuffer } from 'file-type'

// https://www.storyblok.com/docs/api/content-delivery#topics/authentication
const Storyblok = new StoryblokClient({
  accessToken: config.storyblok.export.previewToken,
  cache: {
    clear: 'auto',
    type: 'memory'
  }
})

const start = async () => {
  const response = await Storyblok.get('cdn/stories/home', {
    version: 'draft',
    resolve_relations: 'kavels'
  }).catch((e) => console.log(e))


  const kavels = response.data.rels
  kavels.sort((a, b) => a.position - b.position)
  kavels.reverse()

  const mapped = kavels.map((story, index) => {

    const afbeeldingen = []
    story.content.afbeeldingen.forEach(afbeelding => {
      const filename = afbeelding.filename.split('/').at(-1)


      const download = async () => {
        const response = await fetch(afbeelding.filename);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileType = await fileTypeFromBuffer(buffer)
        const fileWithoutExt = afbeelding.filename.split('.').at(-2).split('/').at(-1)

        if (fileType.ext) {
          const outputFileName = `../../maljaars/public/images/${fileWithoutExt}.${fileType.ext}`
          console.log(`write ${outputFileName}`)
          fs.createWriteStream(outputFileName).write(buffer);
        } else {
          console.log('File type could not be reliably determined! The binary data may be malformed! No file saved!')
        }
      }

      download()

      afbeeldingen.push({
        name: filename,
        path: filename,
      })
    });

    return {
      nummer: index + 1,
      name: story.name,
      omschrijving: Storyblok.richTextResolver.render(story.content.omschrijving),
      afbeeldingen: afbeeldingen
    }
  })

  fs.writeFileSync('../../maljaars/public/kavels.json', JSON.stringify(mapped, null, 2))
}

start()