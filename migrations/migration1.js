const db = require('../db');

/**
 * TABLE libraries
 * add column return_time with default 30
 * add column borrow_limit with default 2
 * 
 * TABLE books
 * add column borrowed_count with default 0
 */

try{
    
    db.prepare(`
        alter table libraries 
        add column
        return_time integer not null default 30
    `).run();

    db.prepare(`
        alter table libraries
        add column
        borrow_limit integer not null default 2
    `).run();

    db.prepare(`
        alter table books
        add column
        borrowed_count integer not null default 0
    `).run();

} catch(error){
    console.log(error);
}
