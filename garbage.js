_getAdjacentCorners: function(hexIndex, corner) {
        var adjacent = [];
        var hexInfo = this.model.getHexPosInfo(hexIndex);
        switch(corner) {
            case 'N':
                if (hexInfo.rowPos === 0 && hexInfo.curRL > hexInfo.nextRL) {
                } else if (hexInfo.rowPos === 0) {
                    adjacent.push([hexIndex+hexInfo.curRL,'NW']); //go right
                } else {
                    adjacent.push([hexIndex-1,'NE']); //go left
                } 
                adjacent.push([hexIndex,'NW']);
                adjacent.push([hexIndex,'NE']);
                break;
            case 'NE':
                if (hexInfo.nextRL < 0) {
                } else if (hexInfo.rowPos === 0 && hexInfo.curRL > hexInfo.nextRL) {
                    adjacent.push([hexIndex+hexInfo.curRL,'N']); //go down
                } else {
                    adjacent.push([hexIndex+hexInfo.curRL,'SE']); //go up
                }
                adjacent.push([hexIndex,'N']);
                adjacent.push([hexIndex,'SE']);
                break;
            case 'SE':
                if (hexInfo.rowPos+1 === hexInfo.curRL && hexInfo.curRL > hexInfo.nextRL) {
                } else if (hexInfo.rowPos+1 === hexInfo.curRL) {
                    adjacent.push([hexIndex+hexInfo.curRL+1,'S']); //go up
                } else {
                    adjacent.push([hexIndex+1,'NE']); //go down
                }
                adjacent.push([hexIndex,'NE']);
                adjacent.push([hexIndex,'S']);
                break;
            case 'S':
                if (hexInfo.rowPos+1 === hexInfo.curRL && hexInfo.prevRL < hexInfo.curRL) {
                } else if (hexInfo.rowPos+1 === hexInfo.curRL) {
                    adjacent.push([hexIndex-hexInfo.curRL,'SE']); //go left
                } else {
                    adjacent.push([hexIndex+1,'SW']); //go right
                }
                adjacent.push([hexIndex,'SW']);
                adjacent.push([hexIndex,'SE']);
                break;
            case 'SW':
                if (hexInfo.prevRL < 0) {
                } else if(hexInfo.curRL > hexInfo.prevRL) {
                    adjacent.push([hexIndex-(hexInfo.curRL-1),'NW']); //go down
                } else if(hexInfo.rowPos+1 === hexInfo.curRL && hexInfo) {
                } else {
                    adjacent.push([hexIndex-hexInfo.curRL,'NW']);
                }
                adjacent.push([hexIndex,'NW']);
                adjacent.push([hexIndex,'S']);
                break;
            case 'NW':
                break;
        } 
        console.warn(adjacent);
    },
