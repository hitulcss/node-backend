const isSubSet = (arr1 , arr2) => {
   for( let id of arr2){
    if( arr1.indexOf(id) == -1){
        return false ;
    }
    continue ;
   }
   return true;
}

module.exports = {
    isSubSet
}