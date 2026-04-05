// SPDX-License-Identifier: MIT 
 pragma solidity ^0.8.0;

 contract simplestorage{


	string[] mentees;

	function addmentees(string memory name) public {

		mentees.push(name);

	}
	uint[] age;

	function addage( uint num) public {
		
		age.push(num);

	}
	
	function viewlist() public view returns(uint[] memory){
		return age;
	}

	function showlist() public view returns(string[] memory){
		return mentees;
	}


	struct Mentee{
		string name;
		uint age;
		bool ispresent;
	}
	Mentee[] public  mentee;

	function setm(string memory _name,uint _age,bool _ispresent) public {
		mentee.push(Mentee(_name,_age,_ispresent));
	}
	function print() public view returns(Mentee[] memory){
		return mentee;
	}
 } 