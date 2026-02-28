# Network Service Design

## Responsibility
Build transaction network graph data between accounts and return it along with pattern detection results.

## Dependencies
- DataStore (data loader service)

## Endpoint Implementation

### GET /api/v1/network

#### Algorithm: N-Hop Expansion via BFS (Breadth-First Search)

1. Receive the origin account ID
2. Get a subset of transaction data with the date filter applied
3. Collect related accounts and transactions within N hops via BFS:

```
exploration_queue = [origin_account]
visited = {origin_account}
hop = 0

while hop < max_hops and queue is not empty:
    next_queue = []
    for account in exploration_queue:
        Search transactions involving the account (from_account or to_account)
        for transaction in related_transactions:
            counterparty_account = the other party in the transaction
            Add transaction to edge list
            if counterparty_account not in visited:
                Add to visited
                Add to next_queue
                Add counterparty_account to node list
    exploration_queue = next_queue
    hop += 1
```

4. Build node information:
   - Aggregate total transaction amount and transaction count for each account
   - Retrieve bank name and entity name from account_lookup
   - Use the maximum fraud_score of transactions related to the account as the node's fraud_score
   - Set `is_origin: true` for the origin account

5. Build edge information:
   - Generate directed edges from sender to receiver for each transaction
   - Assign fraud_score and prediction

6. Attach pattern information:
   - Extract patterns from DataStore.patterns that involve accounts in the node list
   - Return each pattern's type, detail, related transaction IDs, and total amount

#### Performance Constraints
- Node count limit: 200 (if exceeded, prioritize nodes with higher fraud_score)
- Edge count limit: 1000
- When limits are exceeded, add `truncated: true` to the response
