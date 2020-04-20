(
                        for x in $(seq 0 255) ; do for y in $(seq 0 255) ; do echo http://tile.stamen.com/terrain-background/8/${x}/${y}.png ; done ; done
  for z in {0..10} ; do for x in $(seq 0 $((2 ** z - 1))) ; do for y in $(seq 0 $((2 ** z - 1))) ; do echo http://tile.stamen.com/terrain/${z}/${x}/${y}.png ; done ; done ; done
  for z in {0..10} ; do for x in $(seq 0 $((2 ** z - 1))) ; do for y in $(seq 0 $((2 ** z - 1))) ; do echo http://tile.stamen.com/watercolor/${z}/${x}/${y}.jpg ; done ; done ; done
  for z in {0..10} ; do for x in $(seq 0 $((2 ** z - 1))) ; do for y in $(seq 0 $((2 ** z - 1))) ; do echo http://tile.stamen.com/toner-labels/${z}/${x}/${y}.png ; done ; done ; done
) | parallel --xargs --linebuffer 'wget -x -nH -nv'

wget ftp://datapub.gfz-potsdam.de/download/10.5880.GFZ.1.4.2016.001/World_Atlas_2015.zip
unzip World_Atlas_2015.zip
