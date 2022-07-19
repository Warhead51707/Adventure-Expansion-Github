import { world, EntityQueryOptions, BlockLocation, MinecraftBlockTypes } from 'mojang-minecraft'
import { structureConfig } from './structureConfig'

world.events.beforeItemUse.subscribe(itemUse => {
    const item = itemUse.item
    const dimension = world.getDimension(itemUse.source.dimension.id)

    //All Vars For Min Max Crap
    let lootHallsPlacedPosX = 0
    let lootHallsPlacedNegativeX = 0

    let lootHallsPlacedPosZ = 0
    let lootHallsPlacedNegativeZ = 0

    let splitsPlacedPosX = 0
    let lastSplitPlacedPosX = null

    let splitsPlacedNegativeX = 0
    let lastSplitPlacedNegativeX = null

    let splitsPlacedPosZ = 0
    let lastSplitPlacedPosZ = null

    let splitsPlacedNegativeZ = 0
    let lastSplitPlacedNegativeZ = null

    let shouldStopPlacing = false

    const randAllDirections = [{
            direction: 'posX',
            get hallwayMin() {
                return structureConfig.posXConfig.hallwayMin
            },
            get hallwayMax() {
                return structureConfig.posXConfig.hallwayMax
            }
        },
        {
            direction: 'negativeX',
            get hallwayMin() {
                return structureConfig.negativeXConfig.hallwayMin
            },
            get hallwayMax() {
                return structureConfig.negativeXConfig.hallwayMax
            }
        },
        {
            direction: 'posZ',
            get hallwayMin() {
                return structureConfig.posZConfig.hallwayMin
            },
            get hallwayMax() {
                return structureConfig.posZConfig.hallwayMax
            }
        },
        {
            direction: 'negativeZ',
            get hallwayMin() {
                return structureConfig.negativeZConfig.hallwayMin
            },
            get hallwayMax() {
                return structureConfig.negativeZConfig.hallwayMax
            }
        }
    ]

    if (item.id == 'minecraft:stick') {
        const armorStandQuery = new EntityQueryOptions()
        armorStandQuery.type = 'armor_stand'

        const armorStands = dimension.getEntities(armorStandQuery)

        for (let armorStand of armorStands) {
            const armorStandLocation = armorStand.location

            for (let randDirection of randAllDirections) {
                console.warn(randDirection.direction)

                for (let i = 1; i < rand(randDirection.hallwayMin, randDirection.hallwayMax); i++) {
                    switch (randDirection.direction) {
                        case 'posX':
                            runPosX(armorStandLocation, i, false)
                            break
                        case 'negativeX':
                            runNegativeX(armorStandLocation, i, false)
                            break
                        case 'posZ':
                            runPosZ(armorStandLocation, i, false)
                            break
                        case 'negativeZ':
                            runNegativeZ(armorStandLocation, i, false)
                            break
                        default:
                            break
                    }
                }
            }

            armorStand.kill()
        }
    }

    function runPosX(armorStandLocation, i, calledFromSplit) {
        const preLootHalls = lootHallsPlacedPosX
        const preSplits = splitsPlacedPosX

        const blockAtLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x + i, armorStandLocation.y, armorStandLocation.z))

        if (i <= 1) {
            blockAtLocation.setType(MinecraftBlockTypes.planks)
            return
        }

        if (blockAtLocation.type != MinecraftBlockTypes.air) {
            dimension.getBlock(new BlockLocation((armorStandLocation.x + i) - 1, armorStandLocation.y, armorStandLocation.z)).setType(MinecraftBlockTypes.wool)
            shouldStopPlacing = true
            return
        }

        if (shouldStopPlacing) {
            return
        }

        if (calledFromSplit) {
            lootHallsPlacedPosX = 0
            splitsPlacedPosX = 0
        }

        const blockRoomLeftLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x + i, armorStandLocation.y, armorStandLocation.z - 1))
        const blockRoomRightLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x + i, armorStandLocation.y, armorStandLocation.z + 1))

        const posXConfig = structureConfig.posXConfig

        const placeRoom = weighted_random(posXConfig.placeRoomWeights).placeRoom

        if (placeRoom) {
            if (rand(1, 2) == 1) {
                blockRoomLeftLocation.setType(MinecraftBlockTypes.obsidian)
            } else {
                blockRoomRightLocation.setType(MinecraftBlockTypes.obsidian)
            }
        }

        const hallway = weighted_random(posXConfig.lootHallWeights).lootHall

        if (hallway && lootHallsPlacedPosX < posXConfig.lootHallMax) {
            blockAtLocation.setType(MinecraftBlockTypes.cake)
            lootHallsPlacedPosX++
            return
        }

        blockAtLocation.setType(MinecraftBlockTypes.planks)

        const splitPlace = weighted_random(posXConfig.splitWeights).split

        if (splitPlace && splitsPlacedPosX < posXConfig.maxSplits && i >= 3 && (lastSplitPlacedPosX == null || blockAtLocation.x - 2 > lastSplitPlacedPosX.x)) {
            if (blockRoomLeftLocation.type == MinecraftBlockTypes.air) {
                const direction = randAllDirections.find(direction => direction.direction == 'negativeZ')
                lastSplitPlacedPosX = blockRoomLeftLocation

                for (let i = 0; i < rand(direction.hallwayMin, direction.hallwayMax); i++) {
                    if (shouldStopPlacing) {
                        break
                    }
                    runNegativeZ(blockRoomLeftLocation, i)
                }

            } else if (blockRoomRightLocation.type == MinecraftBlockTypes.air) {
                const direction = randAllDirections.find(direction => direction.direction == 'posZ')
                lastSplitPlacedPosX = blockRoomRightLocation

                for (let i = 0; i < rand(direction.hallwayMin, direction.hallwayMax); i++) {
                    if (shouldStopPlacing) {
                        break
                    }

                    runPosZ(blockRoomRightLocation, i)
                }
            }

            splitsPlacedPosX++
            shouldStopPlacing = false
        }

        lootHallsPlacedPosX = preLootHalls
        splitsPlacedPosX = preSplits
    }

    function runNegativeX(armorStandLocation, i, calledFromSplit) {
        const preLootHalls = lootHallsPlacedNegativeX
        const preSplits = splitsPlacedNegativeX

        const blockAtLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x - i, armorStandLocation.y, armorStandLocation.z))

        if (i <= 1) {
            blockAtLocation.setType(MinecraftBlockTypes.planks)
            return
        }

        if (blockAtLocation.type != MinecraftBlockTypes.air) {
            dimension.getBlock(new BlockLocation((armorStandLocation.x - i) + 1, armorStandLocation.y, armorStandLocation.z)).setType(MinecraftBlockTypes.wool)
            shouldStopPlacing = true
            return
        }

        if (shouldStopPlacing) {
            return
        }

        if (calledFromSplit) {
            lootHallsPlacedNegativeX = 0
            splitsPlacedNegativeX = 0
        }

        const blockRoomLeftLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x - i, armorStandLocation.y, armorStandLocation.z + 1))
        const blockRoomRightLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x - i, armorStandLocation.y, armorStandLocation.z - 1))

        const negativeXConfig = structureConfig.negativeXConfig

        const placeRoom = weighted_random(negativeXConfig.placeRoomWeights).placeRoom

        if (placeRoom) {
            if (rand(1, 2) == 1) {
                blockRoomLeftLocation.setType(MinecraftBlockTypes.obsidian)
            } else {
                blockRoomRightLocation.setType(MinecraftBlockTypes.obsidian)
            }
        }

        const hallway = weighted_random(negativeXConfig.lootHallWeights).lootHall

        if (hallway && lootHallsPlacedNegativeX < negativeXConfig.lootHallMax) {
            blockAtLocation.setType(MinecraftBlockTypes.cake)
            lootHallsPlacedNegativeX++
            return
        }

        blockAtLocation.setType(MinecraftBlockTypes.planks)

        const splitPlace = weighted_random(negativeXConfig.splitWeights).split

        if (splitPlace && splitsPlacedNegativeX < negativeXConfig.maxSplits && i >= 3 && (lastSplitPlacedNegativeX == null || blockAtLocation.x + 2 < lastSplitPlacedNegativeX.x)) {
            if (blockRoomLeftLocation.type == MinecraftBlockTypes.air) {
                const direction = randAllDirections.find(direction => direction.direction == 'posZ')
                lastSplitPlacedNegativeX = blockRoomLeftLocation

                for (let i = 0; i < rand(direction.hallwayMin, direction.hallwayMax); i++) {
                    if (shouldStopPlacing) {
                        break
                    }
                    runPosZ(blockRoomLeftLocation, i)
                }

            } else if (blockRoomRightLocation.type == MinecraftBlockTypes.air) {
                const direction = randAllDirections.find(direction => direction.direction == 'negativeZ')
                lastSplitPlacedPosX = blockRoomRightLocation

                for (let i = 0; i < rand(direction.hallwayMin, direction.hallwayMax); i++) {
                    if (shouldStopPlacing) {
                        break
                    }

                    runNegativeZ(blockRoomRightLocation, i)
                }
            }

            splitsPlacedNegativeX++
            shouldStopPlacing = false
        }

        lootHallsPlacedNegativeX = preLootHalls
        splitsPlacedNegativeX = preSplits
    }

    function runPosZ(armorStandLocation, i, calledFromSplit) {
        const preLootHalls = lootHallsPlacedPosZ
        const preSplits = splitsPlacedPosZ

        const blockAtLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x, armorStandLocation.y, armorStandLocation.z + i))

        if (i <= 1) {
            blockAtLocation.setType(MinecraftBlockTypes.planks)
            return
        }

        if (blockAtLocation.type != MinecraftBlockTypes.air) {
            dimension.getBlock(new BlockLocation(armorStandLocation.x, armorStandLocation.y, (armorStandLocation.z + i) - 1)).setType(MinecraftBlockTypes.wool)
            shouldStopPlacing = true
            return
        }

        if (shouldStopPlacing) {
            return
        }

        if (calledFromSplit) {
            lootHallsPlacedPosZ = 0
            splitsPlacedPosZ = 0
        }

        const blockRoomLeftLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x - 1, armorStandLocation.y, armorStandLocation.z + i))
        const blockRoomRightLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x + 1, armorStandLocation.y, armorStandLocation.z + i))

        const posZConfig = structureConfig.posZConfig

        const placeRoom = weighted_random(posZConfig.placeRoomWeights).placeRoom

        if (placeRoom) {
            if (rand(1, 2) == 1) {
                blockRoomLeftLocation.setType(MinecraftBlockTypes.obsidian)
            } else {
                blockRoomRightLocation.setType(MinecraftBlockTypes.obsidian)
            }
        }

        const hallway = weighted_random(posZConfig.lootHallWeights).lootHall

        if (hallway && lootHallsPlacedPosZ < posZConfig.lootHallMax) {
            blockAtLocation.setType(MinecraftBlockTypes.cake)
            lootHallsPlacedPosZ++
            return
        }

        blockAtLocation.setType(MinecraftBlockTypes.planks)

        const splitPlace = weighted_random(posZConfig.splitWeights).split

        if (splitPlace && splitsPlacedPosZ < posZConfig.maxSplits && i >= 3 && (lastSplitPlacedPosZ == null || blockAtLocation.z - 2 < lastSplitPlacedPosZ.z)) {
            if (blockRoomRightLocation.type == MinecraftBlockTypes.air) {
                const direction = randAllDirections.find(direction => direction.direction == 'negativeX')
                lastSplitPlacedPosZ = blockRoomRightLocation

                for (let i = 0; i < rand(direction.hallwayMin, direction.hallwayMax); i++) {
                    if (shouldStopPlacing) {
                        break
                    }

                    runNegativeX(blockRoomLeftLocation, i)
                }

            } else if (blockRoomLeftLocation.type == MinecraftBlockTypes.air) {
                const direction = randAllDirections.find(direction => direction.direction == 'posX')
                lastSplitPlacedPosZ = blockRoomLeftLocation

                for (let i = 0; i < rand(direction.hallwayMin, direction.hallwayMax); i++) {
                    if (shouldStopPlacing) {
                        break
                    }

                    runPosX(blockRoomRightLocation, i)
                }
            }

            splitsPlacedPosZ++
            shouldStopPlacing = false
        }

        lootHallsPlacedPosZ = preLootHalls
        splitsPlacedPosZ = preSplits
    }

    function runNegativeZ(armorStandLocation, i, calledFromSplit) {
        const preLootHalls = lootHallsPlacedNegativeZ
        const preSplits = splitsPlacedNegativeZ

        const blockAtLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x, armorStandLocation.y, armorStandLocation.z - i))

        if (i <= 1) {
            blockAtLocation.setType(MinecraftBlockTypes.planks)
            return
        }

        if (blockAtLocation.type != MinecraftBlockTypes.air) {
            dimension.getBlock(new BlockLocation(armorStandLocation.x, armorStandLocation.y, (armorStandLocation.z - i) + 1)).setType(MinecraftBlockTypes.wool)
            shouldStopPlacing = true
            return
        }

        if (shouldStopPlacing) {
            return
        }

        if (calledFromSplit) {
            lootHallsPlacedNegativeZ = 0
            splitsPlacedNegativeZ = 0
        }

        const blockRoomLeftLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x + 1, armorStandLocation.y, armorStandLocation.z - i))
        const blockRoomRightLocation = dimension.getBlock(new BlockLocation(armorStandLocation.x - 1, armorStandLocation.y, armorStandLocation.z - i))

        const negativeZConfig = structureConfig.negativeZConfig

        const placeRoom = weighted_random(negativeZConfig.placeRoomWeights).placeRoom

        if (placeRoom) {
            if (rand(1, 2) == 1) {
                blockRoomLeftLocation.setType(MinecraftBlockTypes.obsidian)
            } else {
                blockRoomRightLocation.setType(MinecraftBlockTypes.obsidian)
            }
        }

        const hallway = weighted_random(negativeZConfig.lootHallWeights).lootHall

        if (hallway && lootHallsPlacedNegativeZ < negativeZConfig.lootHallMax) {
            blockAtLocation.setType(MinecraftBlockTypes.cake)
            lootHallsPlacedNegativeZ++
            return
        }

        blockAtLocation.setType(MinecraftBlockTypes.planks)

        const splitPlace = weighted_random(negativeZConfig.splitWeights).split

        if (splitPlace && splitsPlacedNegativeZ < negativeZConfig.maxSplits && i >= 3 && (lastSplitPlacedNegativeZ == null || blockAtLocation.z + 2 > lastSplitPlacedNegativeZ.z)) {
            if (blockRoomRightLocation.type == MinecraftBlockTypes.air) {
                const direction = randAllDirections.find(direction => direction.direction == 'posX')
                lastSplitPlacedNegativeZ = blockRoomRightLocation

                for (let i = 0; i < rand(direction.hallwayMin, direction.hallwayMax); i++) {
                    if (shouldStopPlacing) {
                        break
                    }

                    runPosX(blockRoomLeftLocation, i)
                }

            } else if (blockRoomLeftLocation.type == MinecraftBlockTypes.air) {
                const direction = randAllDirections.find(direction => direction.direction == 'negativeX')
                lastSplitPlacedNegativeZ = blockRoomLeftLocation

                for (let i = 0; i < rand(direction.hallwayMin, direction.hallwayMax); i++) {
                    if (shouldStopPlacing) {
                        break
                    }

                    runNegativeX(blockRoomRightLocation, i)
                }
            }

            splitsPlacedNegativeZ++
            shouldStopPlacing = false
        }

        lootHallsPlacedNegativeZ = preLootHalls
        splitsPlacedNegativeZ = preSplits
    }

})

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function weighted_random(options) {
    var i

    var weights = []

    for (i = 0; i < options.length; i++)
        weights[i] = options[i].weight + (weights[i - 1] || 0)

    var random = Math.random() * weights[weights.length - 1]

    for (i = 0; i < weights.length; i++)
        if (weights[i] > random)
            break

    return options[i]
}