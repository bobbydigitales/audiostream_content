import createTorrent from "npm:create-torrent";
import parseTorrent from "npm:parse-torrent";
import magnet from 'npm:magnet-uri' // needed because otherwise deno can't seem to find it.

import once from "npm:once";

interface PlaylistTrack {
    track_name:string,
    album_name:string,
    artist_name:string;
    track_magnet:string;
    album_magnet:string;
    thumbnail:string;
}

class Playlist {
    name = "My Playlist";
    creator_magnet = "";
    tracks:PlaylistTrack[]=  [];
}


const defaultWebRoot = `https://bobbydigitales.github.io/`;


const rootDir = Deno.args[0];
if (rootDir === undefined) {
    console.log(`usage: build.ts <path_to_content>`)
    Deno.exit();
}

const webRoot = Deno.args[1] ?? defaultWebRoot;

const tracksPath = "tracks"

const newPlaylist = new Playlist();

for await (const dirEntry of Deno.readDirSync(rootDir)) {
    if (dirEntry.name.includes(tracksPath)) {
        processTracks(`${rootDir}/${dirEntry.name}`);
    }
}

console.log(newPlaylist);


function processTracks(tracksDirPath: string) {

    for  (const dirEntry of Deno.readDirSync(tracksDirPath)) {
        const trackFilename =`${tracksDirPath}/${dirEntry.name}`;

        createTorrent(trackFilename, {},  (err:any, torrent:any) => {
            if (err) {
                throw new Error(err.message);
            }
    
            // console.log(torrent);

            const torrentFilename = `${rootDir}/torrents/${dirEntry.name}.torrent`;

            // console.log(`Creating torrent for: ${trackFilename}`);
    
            Deno.writeFileSync(torrentFilename, torrent);
            // console.log(`Wrote torrent file: ${torrentFilename}`)

            const parsedTorrent = parseTorrent(torrent);
            const originalMagnetLink = magnet.encode(parsedTorrent);

            const xsComponent = encodeURI(`${webRoot}${torrentFilename}`);
            const wsComponent = encodeURI(`${webRoot}content/tracks/`)
            const finalMagentLink = `${originalMagnetLink}&xs=${xsComponent}&ws=${wsComponent}`
            console.log(finalMagentLink);

            newPlaylist.tracks.push({track_name:dirEntry.name,
                                    album_name:"bobbyd_ep1",
                                    artist_name:"bobbyd",
                                    track_magnet:finalMagentLink,
                                    album_magnet:"",
                                    thumbnail:""});
            // console.log(`${magnet.encode(parsedTorrent)}\n\n`);
            console.log(newPlaylist);

            // webRoot
        });


        

    }

    
}