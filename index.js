function buildWhereClause(filterModel) {

    const result = Object.keys(filterModel).reduce((accum, currKey) => {
        // FIXME handle AND/OR conditions from the UI
        const currAgFilter = filterModel[currKey] // currKey = "surveyId => {}"

        const value = currAgFilter.filter // surveyId.filter = "aekos..."

        const agGridToSailsBasicMapping = {
            notEqual: '!=',
            startsWith: 'startsWith',
            endsWith: 'endsWith',
            contains: 'contains',
            // notContains is not supported
            lessThan: '<',
            lessThanOrEqual: '<=',
            greaterThan: '>',
            greaterThanOrEqual: '>=',
        }

        const agGridCriteria = currAgFilter.type // e.g. "startWith, or equals or notEqual"

        const simpleSailsCriteria = agGridToSailsBasicMapping[agGridCriteria]

        if (simpleSailsCriteria) {
            accum.complexContraints[currKey] = {
                [simpleSailsCriteria]: value
            }
            return accum
        }

        const agGridToSailsComplexMapping = {
            equals: () => {
                accum.keyPairs[currKey] = value
            },
            inRange: () => {
                const filterTo = currAgFilter.filterTo
                accum.complexContraints[currKey] = {
                    '>=': value,
                    '<=': filterTo,
                }
            },
        }
        const complexHandler = agGridToSailsComplexMapping[agGridCriteria]
        if (!complexHandler) {
            throw new
            Error(`Programmer problem: unsupported criteria encountered '${agGridCriteria}'`)
        }
        complexHandler()
        return accum
    }, {
        keyPairs: {},
        complexContraints: {}
    })

    result.complexContraints = Object.keys(result.complexContraints).length ? JSON.stringify(result.complexContraints) : undefined
    return result

}



function getRows(rowsParams) {
    const start = rowsParams.startRow
    const limit = rowsParams.endRow - start
    const sortClause = rowsParams.sortModel.reduce((accum, curr) => {
        accum.push({
            [curr.colId]: curr.sort.toUpperCase(),
        })
        return accum
    }, [])
    const whereClauseConfig = buildWhereClause(rowsParams.filterModel)
    const queryParams = Object.assign(
        whereClauseConfig.keyPairs, {
            limit: limit,
            skip: start,
            sort: JSON.stringify(sortClause),
        },
    )
    if (whereClauseConfig.complexContraints) {
        queryParams['where'] = whereClauseConfig.complexContraints
    }

    return queryParams
}

let rowsParams =  {
    "startRow": 0,
    "endRow": 100,
    "sortModel": [
      {
        "colId": "surveyId",
        "sort": "asc"
      }
    ],
    "filterModel": {
      "surveyId": {
        "type": "contains",
        "filter": "aekos",
        "filterType": "text"
      }
    }
  }

let queryParams = getRows(rowsParams)
console.log(queryParams)