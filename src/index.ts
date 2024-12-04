type JsonPrimitive = number | string | boolean | null;
type JsonNode = JsonPrimitive | JsonNode[] | { [key: string]: JsonNode };

const logDifference = (objectOne: JsonNode, objectTwo: JsonNode, pathToNode: string, differenceText: string) => {
    console.log(
        `-- Difference Found` +
            `\n-- -- ${differenceText}` +
            `\n-- -- PATH: ${pathToNode}` +
            `\n-- -- Object One:` +
            `\n${JSON.stringify(objectOne, null, 4)}\n` +
            `\n-- -- Object Two:` +
            `\n${JSON.stringify(objectTwo, null, 4)}\n`,
    );
};

const recursiveCompare = (objectOne: JsonNode, objectTwo: JsonNode, pathToNode: string = 'root'): boolean => {
    const d = (message: string) => logDifference(objectOne, objectTwo, pathToNode, message);

    if (objectOne instanceof Array || objectTwo instanceof Array) {
        if (objectOne instanceof Array && !(objectTwo instanceof Array)) {
            d('Object one is an array, but object two is not.');
            return false;
        } else if (objectTwo instanceof Array && !(objectOne instanceof Array)) {
            d('Object two is an array, but object one is not.');
            return false;
        }

        const arrayOne = objectOne as Array<JsonNode>;
        const arrayTwo = objectTwo as Array<JsonNode>;
        if (arrayOne.length !== arrayTwo.length) {
            d(`arrays have mismatched lengths: ${arrayOne.length} != ${arrayTwo.length}`);
            return false;
        }
        for (let i = 0; i < arrayOne.length; i++) {
            const itemOne = arrayOne[i];
            const itemTwo = arrayTwo[i];
            if (
                itemOne instanceof Array ||
                itemTwo instanceof Array ||
                (!['string', 'number', 'boolean'].includes(typeof itemOne) && itemOne !== null) ||
                (!['string', 'number', 'boolean'].includes(typeof itemTwo) && itemTwo !== null)
            ) {
                const itemsMatch = recursiveCompare(itemOne, itemTwo, `${pathToNode}[${i}]`);
                if (!itemsMatch) return itemsMatch;
                continue;
            }

            if (
                [itemOne, itemTwo].some((val) => ['string', 'number', 'boolean'].includes(typeof val) || val === null)
            ) {
                if (itemOne !== itemTwo) {
                    d(`Objects at index ${i} don't match: ${itemOne} != ${itemTwo}`);
                    return false;
                }
                continue;
            }

            const itemsMatch = recursiveCompare(itemOne, itemTwo, `${pathToNode}[${i}]`);
            if (!itemsMatch) return itemsMatch;
        }
    }

    if ([objectOne, objectTwo].some((val) => ['string', 'number', 'boolean'].includes(typeof val) || val === null)) {
        if (objectOne !== objectTwo) {
            d(`Objects don't match: ${objectOne} != ${objectTwo}`);
            return false;
        }
    }

    const objectOneProperties = Object.keys(objectOne as { [key: string]: JsonNode });
    const objectTwoProperties = Object.keys(objectTwo as { [key: string]: JsonNode });
    if (objectOneProperties.length !== objectTwoProperties.length) {
        d(
            `Mismatched number of properties in object: ${JSON.stringify(objectOneProperties)} != ${JSON.stringify(objectTwoProperties)}`,
        );
        return false;
    }

    for (const propName of objectOneProperties) {
        if (!objectTwoProperties.includes(propName)) {
            d(`Prop missing from objectTwo: ${propName} not in ${JSON.stringify(objectTwoProperties)}`);
        }
        const itemOne = (objectOne as { [key: string]: JsonNode })[propName];
        const itemTwo = (objectTwo as { [key: string]: JsonNode })[propName];
        const itemsMatch = recursiveCompare(itemOne, itemTwo, `${pathToNode}.${propName}`);
        if (!itemsMatch) return itemsMatch;
    }

    return true;
};

const basicMatch = recursiveCompare({ a: 1, b: 1 }, { a: 1, b: 1 });
console.log(`Basic matches show as identical: ${basicMatch}\n\n`);

const nestedBasicMatch = recursiveCompare([{ a: 1, b: 1 }], [{ a: 1, b: 1 }]);
console.log(`Nested basic matches show as identical: ${nestedBasicMatch}\n\n`);

const basicMismatch = recursiveCompare({ a: 1, b: 1 }, { a: 1, b: 2 });
console.log(`Basic mismatch show as mismatch: ${!basicMismatch}\n\n`);

const basicTypeMismatch = recursiveCompare({ a: 1, b: 1 }, { a: '1', b: 1 });
console.log(`Basic type mismatch show as mismatch: ${!basicTypeMismatch}\n\n`);

const nestedBasicMismatch = recursiveCompare([{ a: 1, b: 1 }], [{ a: 1, b: 2 }]);
console.log(`Nested mismatch shows as mismatch: ${!nestedBasicMismatch}\n\n`);

const nestingMismatch = recursiveCompare([{ a: 1, b: 1 }], [{ a: 1, b: [1] }]);
console.log(`Nesting mismatch shows as mismatch: ${!nestingMismatch}\n\n`);
