<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Divisiontounion extends Model
{
    protected $fillable = [
        'divisions',
        'districts',
        'upazilas',
        'unions',
        'postoffices',
        'postcodes',
    ];
}
