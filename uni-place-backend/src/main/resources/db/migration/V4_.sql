ALTER TABLE contract
  MODIFY COLUMN contract_st
    ENUM('requested','approved','active','ended','cancelled')
    NOT NULL DEFAULT 'requested';
    

